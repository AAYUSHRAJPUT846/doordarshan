"use strict";

const _MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: "user",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

class MediaManager {
  constructor() {
    this._localStream = null;
    this._screenStream = null;
    this._handlers = {};
    this._isMuted = false;
    this._isCamOff = false;
    this._isScreenSharing = false;
  }

  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return this;
  }

  _emit(event, ...args) {
    for (const h of this._handlers[event] || []) {
      try {
        h(...args);
      } catch (err) {
        console.error("[Media] handler error:", err);
      }
    }
  }

  async start() {
    try {
      this._localStream =
        await navigator.mediaDevices.getUserMedia(_MEDIA_CONSTRAINTS);
      this._isMuted = false;
      this._isCamOff = false;
      this._emit("stream", this._localStream);
      return this._localStream;
    } catch (err) {
      this._emit("error", err);
      throw err;
    }
  }

  async startAudioOnly() {
    try {
      this._localStream = await navigator.mediaDevices.getUserMedia({
        audio: _MEDIA_CONSTRAINTS.audio,
        video: false,
      });
      this._isMuted = false;
      this._isCamOff = true;
      this._emit("stream", this._localStream);
      return this._localStream;
    } catch (err) {
      this._emit("error", err);
      throw err;
    }
  }

  getStream() {
    return this._localStream;
  }

  getScreenStream() {
    return this._screenStream;
  }

  getVideoTrack() {
    return this._localStream?.getVideoTracks()[0] ?? null;
  }

  getAudioTrack() {
    return this._localStream?.getAudioTracks()[0] ?? null;
  }

  toggleMic() {
    this._isMuted = !this._isMuted;
    const track = this.getAudioTrack();
    if (track) track.enabled = !this._isMuted;
    this._emit("micToggle", this._isMuted);
    return this._isMuted;
  }

  toggleCamera() {
    if (this._isScreenSharing) {
      this.stopScreenShare();
      return false;
    }
    this._isCamOff = !this._isCamOff;
    const track = this.getVideoTrack();
    if (track) track.enabled = !this._isCamOff;
    this._emit("cameraToggle", this._isCamOff);
    return this._isCamOff;
  }

  async startScreenShare() {
    if (this._isScreenSharing) return null;
    try {
      this._screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: false,
      });
      const screenTrack = this._screenStream.getVideoTracks()[0];
      screenTrack.addEventListener("ended", () => this.stopScreenShare());
      this._isScreenSharing = true;
      this._emit("screenShare", screenTrack);
      return screenTrack;
    } catch (err) {
      if (err.name !== "NotAllowedError") this._emit("error", err);
      return null;
    }
  }

  stopScreenShare() {
    if (!this._isScreenSharing) return;
    this._screenStream?.getTracks().forEach((t) => t.stop());
    this._screenStream = null;
    this._isScreenSharing = false;
    const camTrack = this.getVideoTrack();
    this._emit("screenShareStop", camTrack);
  }

  async enumerateDevices() {
    const all = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    return {
      cameras: all.filter((d) => d.kind === "videoinput"),
      mics: all.filter((d) => d.kind === "audioinput"),
    };
  }

  async switchCamera(deviceId) {
    const oldTrack = this.getVideoTrack();
    if (oldTrack) {
      oldTrack.stop();
      this._localStream.removeTrack(oldTrack);
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, ...(_MEDIA_CONSTRAINTS.video) },
    });
    const newTrack = newStream.getVideoTracks()[0];
    this._localStream.addTrack(newTrack);
    if (this._isCamOff) newTrack.enabled = false;
    this._emit("videoTrackChanged", newTrack);
    return newTrack;
  }

  async switchMic(deviceId) {
    const oldTrack = this.getAudioTrack();
    if (oldTrack) {
      oldTrack.stop();
      this._localStream.removeTrack(oldTrack);
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    });
    const newTrack = newStream.getAudioTracks()[0];
    this._localStream.addTrack(newTrack);
    if (this._isMuted) newTrack.enabled = false;
    this._emit("audioTrackChanged", newTrack);
    return newTrack;
  }

  isMuted() {
    return this._isMuted;
  }

  isCamOff() {
    return this._isCamOff;
  }

  isScreenSharing() {
    return this._isScreenSharing;
  }

  hasVideo() {
    return (this._localStream?.getVideoTracks().length ?? 0) > 0;
  }

  stop() {
    this._localStream?.getTracks().forEach((t) => t.stop());
    this._screenStream?.getTracks().forEach((t) => t.stop());
    this._localStream = null;
    this._screenStream = null;
    this._isScreenSharing = false;
  }
}

window.DoordarshMedia = MediaManager;
