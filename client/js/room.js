"use strict";

const api = window.DoordarshApi;
const auth = window.DoordarshAuth;

auth.requireAuth();

const params = new URLSearchParams(window.location.search);
const ROOM_CODE = params.get("room");

if (!ROOM_CODE) {
  window.location.href = "dashboard.html";
}

const videoGrid = document.getElementById("video-grid");
const participantsList = document.getElementById("participants-list");
const chatMessages = document.getElementById("chat-messages");
const chatTextarea = document.getElementById("chat-textarea");
const chatSendBtn = document.getElementById("chat-send-btn");
const wsStatus = document.getElementById("ws-status");
const wsStatusText = document.getElementById("ws-status-text");
const roomNameEl = document.getElementById("room-name");
const topbarCodeEl = document.getElementById("topbar-code");
const participantCount = document.getElementById("participant-count");

const btnMute = document.getElementById("ctrl-mute");
const btnCamera = document.getElementById("ctrl-camera");
const btnChat = document.getElementById("ctrl-chat");
const btnLeave = document.getElementById("ctrl-leave");

const self = auth.getUser();

let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECTS = 5;

const participants = new Map();

let isMuted = false;
let isCamOff = false;
let isChatOpen = true;

const MSG = {
  PING: "ping",
  PONG: "pong",
  LEAVE: "leave",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice_candidate",
  DIRECT_MESSAGE: "direct_message",
  PARTICIPANT_JOINED: "participant_joined",
  PARTICIPANT_LEFT: "participant_left",
  PARTICIPANT_LIST: "participant_list",
  ERROR: "error",
};

const toastContainer = document.getElementById("toast-container");

function showToast(message, type = "info", duration = 3500) {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, duration);
}

async function initRoomInfo() {
  try {
    const room = await api.getRoom(ROOM_CODE);
    if (roomNameEl) roomNameEl.textContent = room.title;
    document.title = `${room.title} — Doordarshan`;
  } catch {
    if (roomNameEl) roomNameEl.textContent = ROOM_CODE;
  }

  if (topbarCodeEl) {
    topbarCodeEl.querySelector(".code-text").textContent = ROOM_CODE;
    topbarCodeEl.addEventListener("click", async () => {
      await navigator.clipboard.writeText(ROOM_CODE).catch(() => {});
      showToast("Room code copied!", "success", 1800);
    });
  }
}

function setWsStatus(state) {
  wsStatus.className = `ws-status ${state}`;
  const labels = {
    connecting: "Connecting…",
    connected: "Live",
    disconnected: "Disconnected",
  };
  if (wsStatusText) wsStatusText.textContent = labels[state] ?? state;
}

function connectWs() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  )
    return;

  setWsStatus("connecting");
  const url = api.buildWsUrl(ROOM_CODE);
  ws = new WebSocket(url);

  ws.addEventListener("open", onWsOpen);
  ws.addEventListener("message", onWsMessage);
  ws.addEventListener("close", onWsClose);
  ws.addEventListener("error", onWsError);
}

function onWsOpen() {
  reconnectAttempts = 0;
  setWsStatus("connected");
  showToast("Connected to room", "success", 2000);
  addParticipant({ user_id: self.id, username: self.username }, true);
}

function onWsClose(e) {
  setWsStatus("disconnected");

  if (e.code === 1000) return;

  if (e.code === 1008) {
    showToast("Session expired. Please log in again.", "error");
    auth.logout();
    return;
  }

  if (reconnectAttempts < MAX_RECONNECTS) {
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 15000);
    reconnectAttempts++;
    showToast(`Connection lost. Reconnecting in ${delay / 1000}s…`, "info");
    reconnectTimer = setTimeout(connectWs, delay);
  } else {
    showToast("Could not reconnect. Please refresh the page.", "error", 0);
  }
}

function onWsError() {
  console.warn("[Doordarshan] WebSocket error");
}

function onWsMessage(event) {
  let msg;
  try {
    msg = JSON.parse(event.data);
  } catch {
    console.warn("[WS] Non-JSON frame:", event.data);
    return;
  }

  switch (msg.type) {
    case MSG.PING:
      wsSend({ type: MSG.PONG });
      break;

    case MSG.PARTICIPANT_LIST:
      handleParticipantList(msg.participants);
      break;

    case MSG.PARTICIPANT_JOINED:
      handleParticipantJoined(msg);
      break;

    case MSG.PARTICIPANT_LEFT:
      handleParticipantLeft(msg);
      break;

    case MSG.OFFER:
      console.log("[WebRTC stub] Received offer from", msg.from_user_id);
      handleIncomingOffer(msg);
      break;

    case MSG.ANSWER:
      console.log("[WebRTC stub] Received answer from", msg.from_user_id);
      handleIncomingAnswer(msg);
      break;

    case MSG.ICE_CANDIDATE:
      console.log(
        "[WebRTC stub] Received ICE candidate from",
        msg.from_user_id,
      );
      handleIncomingIce(msg);
      break;

    case MSG.DIRECT_MESSAGE:
      handleIncomingDm(msg);
      break;

    case MSG.ERROR:
      showToast(`Server error: ${msg.message}`, "error");
      console.error("[WS error]", msg);
      break;

    default:
      console.warn("[WS] Unknown message type:", msg.type);
  }
}

function wsSend(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("[WS] Cannot send — socket not open:", payload);
    return false;
  }
  ws.send(JSON.stringify(payload));
  return true;
}

function handleParticipantList(list) {
  for (const [uid] of participants) {
    if (uid !== self.id) removeParticipant(uid);
  }
  for (const p of list) {
    if (p.user_id !== self.id) addParticipant(p, false);
  }
}

function handleParticipantJoined(msg) {
  if (msg.user_id === self.id) return;
  addParticipant({ user_id: msg.user_id, username: msg.username }, false);
  addSystemMsg(`${msg.username} joined`);
  showToast(`${msg.username} joined the room`, "info", 2500);
}

function handleParticipantLeft(msg) {
  removeParticipant(msg.user_id);
  addSystemMsg(`${msg.username} left`);
  showToast(`${msg.username} left`, "info", 2000);
}

function createPeerConnection(remoteUserId) {
  console.log(
    "[WebRTC stub] createPeerConnection called for user",
    remoteUserId,
  );
}

function sendOffer(targetUserId, sdp) {
  wsSend({ type: MSG.OFFER, target_user_id: targetUserId, sdp });
}

function handleIncomingOffer(msg) {}

function sendAnswer(targetUserId, sdp) {
  wsSend({ type: MSG.ANSWER, target_user_id: targetUserId, sdp });
}

function handleIncomingAnswer(msg) {}

function sendIceCandidate(targetUserId, candidate) {
  wsSend({ type: MSG.ICE_CANDIDATE, target_user_id: targetUserId, candidate });
}

function handleIncomingIce(msg) {}

function attachStream(userId, stream) {
  const tile = document.querySelector(`[data-uid="${userId}"]`);
  if (!tile) return;
  const video = tile.querySelector("video");
  const avatar = tile.querySelector(".tile-avatar");
  if (video) {
    video.srcObject = stream;
    video.play().catch(() => {});
    if (avatar) avatar.style.display = "none";
  }
}

function addParticipant(p, isSelf) {
  if (participants.has(p.user_id)) return;
  participants.set(p.user_id, p);

  const initials = auth.getInitials(p.username);
  const color = auth.avatarColor(String(p.user_id));

  const tile = document.createElement("div");
  tile.className = `video-tile${isSelf ? " self-tile" : ""}`;
  tile.dataset.uid = p.user_id;
  tile.innerHTML = `
    <video autoplay playsinline muted="${isSelf}"></video>
    <div class="tile-avatar">
      <div class="avatar-circle" style="background:${color};">${initials}</div>
      <span class="tile-username">${_esc(p.username)}${isSelf ? " (You)" : ""}</span>
    </div>
    <div class="tile-label">
      <span class="tile-name-pill">${_esc(p.username)}${isSelf ? " · You" : ""}</span>
    </div>
  `;
  videoGrid.appendChild(tile);
  updateGridClass();

  const item = document.createElement("div");
  item.className = "participant-item";
  item.dataset.uid = p.user_id;
  item.innerHTML = `
    <div class="avatar-circle sm" style="background:${color};">${initials}</div>
    <span class="participant-name">${_esc(p.username)}</span>
    ${isSelf ? '<span class="participant-badge">You</span>' : ""}
  `;
  participantsList.appendChild(item);

  updateParticipantCount();
}

function removeParticipant(userId) {
  participants.delete(userId);

  videoGrid.querySelector(`[data-uid="${userId}"]`)?.remove();
  participantsList.querySelector(`[data-uid="${userId}"]`)?.remove();

  updateGridClass();
  updateParticipantCount();
}

function updateGridClass() {
  const n = Math.min(participants.size, 9);
  videoGrid.className = `video-grid count-${Math.max(n, 1)}`;
}

function updateParticipantCount() {
  if (participantCount) participantCount.textContent = participants.size;
}

function handleIncomingDm(msg) {
  const sender = participants.get(msg.from_user_id);
  const name = sender?.username ?? `User ${msg.from_user_id}`;
  appendChatMsg(name, msg.content, msg.from_user_id === self.id);
}

function appendChatMsg(name, content, isSelf) {
  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const el = document.createElement("div");
  el.className = `chat-msg${isSelf ? " self" : ""}`;
  el.innerHTML = `
    <div class="chat-msg-header">
      <span class="chat-msg-name">${_esc(name)}</span>
      <span class="chat-msg-time">${time}</span>
    </div>
    <div class="chat-msg-body">${_esc(content)}</div>
  `;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMsg(text) {
  const el = document.createElement("div");
  el.className = "chat-system-msg";
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage(content) {
  if (!content.trim()) return;

  appendChatMsg(self.username, content, true);

  let sent = 0;
  for (const [uid] of participants) {
    if (uid === self.id) continue;
    wsSend({ type: MSG.DIRECT_MESSAGE, target_user_id: uid, content });
    sent++;
  }

  if (sent === 0) {
    addSystemMsg("No one else is in the room yet.");
  }
}

chatSendBtn?.addEventListener("click", () => {
  const content = chatTextarea.value.trim();
  if (!content) return;
  sendChatMessage(content);
  chatTextarea.value = "";
  chatTextarea.style.height = "auto";
});

chatTextarea?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatSendBtn.click();
  }
});

chatTextarea?.addEventListener("input", () => {
  chatTextarea.style.height = "auto";
  chatTextarea.style.height = `${chatTextarea.scrollHeight}px`;
});

btnMute?.addEventListener("click", () => {
  isMuted = !isMuted;
  btnMute.classList.toggle("muted", isMuted);
  btnMute.querySelector(".ctrl-icon").textContent = isMuted ? "🔇" : "🎤";
  btnMute.querySelector(".ctrl-label").textContent = isMuted
    ? "Unmute"
    : "Mute";

  const selfTile = videoGrid.querySelector(`[data-uid="${self.id}"]`);
  if (selfTile) {
    const existingIcon = selfTile.querySelector(".tile-mute-icon");
    if (isMuted && !existingIcon) {
      const icon = document.createElement("div");
      icon.className = "tile-mute-icon";
      icon.textContent = "🔇";
      selfTile.querySelector(".tile-label").appendChild(icon);
    } else if (!isMuted && existingIcon) {
      existingIcon.remove();
    }
  }
});

btnCamera?.addEventListener("click", () => {
  isCamOff = !isCamOff;
  btnCamera.classList.toggle("muted", isCamOff);
  btnCamera.querySelector(".ctrl-icon").textContent = isCamOff ? "📷" : "📹";
  btnCamera.querySelector(".ctrl-label").textContent = isCamOff
    ? "Show cam"
    : "Camera";

  const selfTile = videoGrid.querySelector(`[data-uid="${self.id}"]`);
  if (selfTile) {
    const avatar = selfTile.querySelector(".tile-avatar");
    if (avatar) avatar.style.display = isCamOff ? "flex" : "none";
  }
});

btnChat?.addEventListener("click", () => {
  isChatOpen = !isChatOpen;
  const sidebar = document.getElementById("room-sidebar");
  sidebar?.classList.toggle("collapsed", !isChatOpen);
  btnChat.classList.toggle("active", isChatOpen);
});

btnLeave?.addEventListener("click", leaveRoom);

async function leaveRoom() {
  clearTimeout(reconnectTimer);

  wsSend({ type: MSG.LEAVE });

  if (ws) {
    ws.onclose = null;
    ws.close(1000, "User left");
  }

  try {
    await api.leaveRoom(ROOM_CODE);
  } catch (err) {
    console.error(err);
  }

  window.location.href = "dashboard.html";
}

window.addEventListener("beforeunload", () => {
  wsSend({ type: MSG.LEAVE });
  ws?.close(1000, "Page unload");
});

document.querySelectorAll(".sidebar-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".sidebar-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const target = tab.dataset.tab;
    document.querySelectorAll(".sidebar-panel").forEach((p) => {
      p.classList.toggle("hidden", p.dataset.panel !== target);
    });
  });
});

function _esc(str = "") {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

(async function init() {
  await initRoomInfo();

  await api.joinRoom(ROOM_CODE);

  connectWs();
})();
