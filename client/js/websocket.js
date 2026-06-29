"use strict";

class WebSocketManager {
  constructor() {
    this._ws = null;
    this._url = null;
    this._reconnectAttempts = 0;
    this._maxReconnects = 5;
    this._reconnectTimer = null;
    this._handlers = {};
    this._manualClose = false;
  }

  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return this;
  }

  off(event, handler) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter((h) => h !== handler);
  }

  _emit(event, ...args) {
    for (const h of this._handlers[event] || []) {
      try {
        h(...args);
      } catch (err) {
        console.error("[WS] handler error:", err);
      }
    }
  }

  connect(url) {
    this._url = url;
    this._manualClose = false;
    this._doConnect();
  }

  _doConnect() {
    if (
      this._ws &&
      (this._ws.readyState === WebSocket.OPEN ||
        this._ws.readyState === WebSocket.CONNECTING)
    )
      return;

    this._emit("status", "connecting");
    this._ws = new WebSocket(this._url);
    this._ws.addEventListener("open", () => this._onOpen());
    this._ws.addEventListener("message", (e) => this._onMessage(e));
    this._ws.addEventListener("close", (e) => this._onClose(e));
    this._ws.addEventListener("error", () => this._emit("error"));
  }

  _onOpen() {
    this._reconnectAttempts = 0;
    this._emit("status", "connected");
    this._emit("open");
  }

  _onMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      console.warn("[WS] non-JSON frame:", event.data);
      return;
    }
    this._emit("message", msg);
    if (msg.type) this._emit(`msg:${msg.type}`, msg);
  }

  _onClose(e) {
    this._emit("status", "disconnected");
    this._emit("close", e);

    if (this._manualClose || e.code === 1000) return;

    if (e.code === 1008) {
      this._emit("auth_error");
      return;
    }

    if (this._reconnectAttempts < this._maxReconnects) {
      const delay = Math.min(1000 * 2 ** this._reconnectAttempts, 15000);
      this._reconnectAttempts++;
      this._emit("reconnecting", {
        attempt: this._reconnectAttempts,
        delay,
      });
      this._reconnectTimer = setTimeout(() => this._doConnect(), delay);
    } else {
      this._emit("reconnect_failed");
    }
  }

  send(payload) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return false;
    this._ws.send(JSON.stringify(payload));
    return true;
  }

  disconnect(code = 1000, reason = "User left") {
    this._manualClose = true;
    clearTimeout(this._reconnectTimer);
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.close(code, reason);
      this._ws = null;
    }
  }

  get isOpen() {
    return this._ws?.readyState === WebSocket.OPEN;
  }
}

window.DoordarshWS = WebSocketManager;
