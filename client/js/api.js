"use strict";

const API_BASE = `${window.location.origin}/api/v1`;

const WS_BASE =
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  
function _getToken() {
  return sessionStorage.getItem("dd_token") || localStorage.getItem("dd_token");
}

function _headers(auth = true, contentType = "application/json") {
  const h = {};
  if (contentType) h["Content-Type"] = contentType;
  if (auth) {
    const token = _getToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

async function _fetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.detail ?? body?.message ?? `HTTP ${res.status}`;
    const err = new Error(
      Array.isArray(message)
        ? message.map((e) => e.msg ?? e).join("; ")
        : message,
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

async function register({ username, email, password }) {
  return _fetch("/auth/register", {
    method: "POST",
    headers: _headers(false),
    body: JSON.stringify({ username, email, password }),
  });
}

async function login({ email, password }) {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  return _fetch("/auth/login", {
    method: "POST",
    headers: _headers(false, "application/x-www-form-urlencoded"),
    body: form.toString(),
  });
}

async function createRoom({ title }) {
  return _fetch("/rooms", {
    method: "POST",
    headers: _headers(true),
    body: JSON.stringify({ title }),
  });
}

async function joinRoom(roomCode) {
  return _fetch(`/rooms/${encodeURIComponent(roomCode)}/join`, {
    method: "POST",
    headers: _headers(true),
  });
}

async function leaveRoom(roomCode) {
  return _fetch(`/rooms/${encodeURIComponent(roomCode)}/leave`, {
    method: "POST",
    headers: _headers(true),
  });
}

async function listParticipants(roomCode) {
  return _fetch(`/rooms/${encodeURIComponent(roomCode)}/participants`, {
    headers: _headers(true),
  });
}

async function listRooms() {
  return _fetch("/rooms", { headers: _headers(true) });
}

async function getRoom(code) {
  return _fetch(`/rooms/${encodeURIComponent(code)}`, {
    headers: _headers(true),
  });
}

async function deleteRoom(code) {
  return _fetch(`/rooms/${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: _headers(true),
  });
}

async function createMeeting(data) {
  return _fetch("/meetings", {
    method: "POST",
    headers: _headers(true),
    body: JSON.stringify(data),
  });
}

async function listMeetings() {
  return _fetch("/meetings", { headers: _headers(true) });
}

async function getMeeting(id) {
  return _fetch(`/meetings/${id}`, { headers: _headers(true) });
}

async function deleteMeeting(id) {
  return _fetch(`/meetings/${id}`, {
    method: "DELETE",
    headers: _headers(true),
  });
}

function buildWsUrl(roomCode) {
  const token = _getToken();
  return `${WS_BASE}/ws/rooms/${encodeURIComponent(roomCode)}?token=${encodeURIComponent(token)}`;
}

window.DoordarshApi = {
  register,
  login,
  createRoom,
  listRooms,
  getRoom,
  deleteRoom,
  createMeeting,
  listMeetings,
  getMeeting,
  deleteMeeting,

  joinRoom,
  leaveRoom,
  listParticipants,

  buildWsUrl,
  _getToken,
};
