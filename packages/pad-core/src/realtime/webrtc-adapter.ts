import { encodeJson, decodeJson, envelope, ns, type CircleId, type PeerId, type Topic, type MessageEnvelope, type RealtimePort } from './port';

/**
 * WebRtcAdapter — hybrid P2P realtime adapter (signaling + DataChannels)
 * ---------------------------------------------------------------------
 * This is a scaffold for the full peer-to-peer implementation.
 * It connects peers via a lightweight signaling WebSocket and uses
 * WebRTC DataChannels for encrypted, low-latency message exchange.
 *
 * For now, this adapter only logs connection flow and mirrors the API.
 * You can expand it to full WebRTC mesh or hub-spoke topology later.
 */

export interface WebRtcConfig {
  signalUrl: string; // WebSocket signaling server URL
  circleId: CircleId;
  peerId?: PeerId;
  iceServers?: RTCIceServer[];
}

export class WebRtcAdapter implements RealtimePort {
  private _peerId: PeerId;
  private _circleId: CircleId | null = null;
  private _status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private _ws: WebSocket | null = null;
  private _peers: Map<PeerId, RTCPeerConnection> = new Map();
  private _channels: Map<PeerId, RTCDataChannel> = new Map();
  private _handlers: Map<string, Set<(payload: any, envelope: MessageEnvelope<any>) => void>> = new Map();

  constructor(private cfg: WebRtcConfig) {
    this._peerId = cfg.peerId || `peer:rtc-${Math.random().toString(36).slice(2, 8)}`;
  }

  status() {
    return this._status;
  }

  myPeerId() {
    return this._peerId;
  }

  async joinCircle(circleId: CircleId) {
    this._circleId = circleId;
    this._status = 'connecting';
    try {
      await this._connectSignal();
      this._status = 'connected';
      console.info('[webrtc] connected to signaling hub');
    } catch (err) {
      console.error('[webrtc] signaling failed', err);
      this._status = 'disconnected';
    }
  }

  async leaveCircle() {
    for (const ch of this._channels.values()) ch.close();
    for (const pc of this._peers.values()) pc.close();
    this._channels.clear();
    this._peers.clear();
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._status = 'disconnected';
    console.info('[webrtc] left circle');
  }

  publish<T = unknown>(topic: Topic, payload: T | Uint8Array) {
    if (!this._circleId) return;
    const body = payload instanceof Uint8Array ? (decodeJson(payload) as T) : payload;
    const msg: MessageEnvelope<T> = envelope(this._circleId, this._peerId, topic, body);
    const json = JSON.stringify(msg);
    // Broadcast to all open DataChannels
    for (const [pid, ch] of this._channels.entries()) {
      if (ch.readyState === 'open') {
        ch.send(json);
      }
    }
  }

  subscribe<T = unknown>(topic: Topic, handler: (payload: T, envelope: MessageEnvelope<T>) => void): () => void {
    const key = topic;
    const set = this._handlers.get(key) || new Set();
    set.add(handler as any);
    this._handlers.set(key, set);
    return () => set.delete(handler as any);
  }

  // ---------------------------------------------------------------------------
  // Signaling logic (simplified placeholder)
  // ---------------------------------------------------------------------------

  private async _connectSignal() {
    const { signalUrl } = this.cfg;
    this._ws = new WebSocket(signalUrl);
    this._ws.addEventListener('open', () => {
      this._sendSignal({ type: 'join', circleId: this._circleId, peerId: this._peerId });
    });
    this._ws.addEventListener('message', (e) => this._handleSignal(JSON.parse(e.data)));
    this._ws.addEventListener('close', () => {
      this._status = 'disconnected';
    });
  }

  private _sendSignal(obj: any) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(obj));
    }
  }

  private async _handleSignal(msg: any) {
    const { type, from, data } = msg;
    if (from === this._peerId) return;

    switch (type) {
      case 'offer':
        await this._handleOffer(from, data);
        break;
      case 'answer':
        await this._handleAnswer(from, data);
        break;
      case 'ice':
        await this._handleIce(from, data);
        break;
      case 'peers':
        for (const p of data as PeerId[]) {
          if (p !== this._peerId) this._createConnection(p, true);
        }
        break;
      default:
        console.debug('[webrtc] unknown signal', msg);
    }
  }

  private async _createConnection(peerId: PeerId, initiator: boolean) {
    const pc = new RTCPeerConnection({ iceServers: this.cfg.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] });
    this._peers.set(peerId, pc);

    const channel = initiator ? pc.createDataChannel('garden') : null;
    if (channel) this._attachChannel(peerId, channel);

    pc.ondatachannel = (e) => {
      this._attachChannel(peerId, e.channel);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) this._sendSignal({ type: 'ice', from: this._peerId, to: peerId, data: e.candidate });
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this._sendSignal({ type: 'offer', from: this._peerId, to: peerId, data: offer });
    }
  }

  private async _handleOffer(from: PeerId, offer: RTCSessionDescriptionInit) {
    const pc = new RTCPeerConnection({ iceServers: this.cfg.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] });
    this._peers.set(from, pc);

    pc.ondatachannel = (e) => this._attachChannel(from, e.channel);
    pc.onicecandidate = (e) => {
      if (e.candidate) this._sendSignal({ type: 'ice', from: this._peerId, to: from, data: e.candidate });
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this._sendSignal({ type: 'answer', from: this._peerId, to: from, data: answer });
  }

  private async _handleAnswer(from: PeerId, answer: RTCSessionDescriptionInit) {
    const pc = this._peers.get(from);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async _handleIce(from: PeerId, candidate: RTCIceCandidateInit) {
    const pc = this._peers.get(from);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private _attachChannel(peerId: PeerId, ch: RTCDataChannel) {
    this._channels.set(peerId, ch);
    ch.onopen = () => console.debug('[webrtc] channel open', peerId);
    ch.onclose = () => console.debug('[webrtc] channel closed', peerId);
    ch.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as MessageEnvelope;
        const handlers = this._handlers.get(msg.type);
        if (!handlers) return;
        for (const h of handlers) {
          const decoded = decodeJson(msg.body as Uint8Array | unknown);
          h(decoded, msg);
        }
      } catch (err) {
        console.warn('[webrtc] bad message', err);
      }
    };
  }
}

/** Factory helper */
export function createWebRtcAdapter(cfg: WebRtcConfig): RealtimePort {
  return new WebRtcAdapter(cfg);
}
