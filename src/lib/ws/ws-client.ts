export type WsClientStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

type WsHandlers = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
};

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  status: WsClientStatus = "idle";

  connect(url: string, handlers: WsHandlers = {}) {
    this.url = url;

    if (this.ws && (this.status === "connecting" || this.status === "open")) {
      return;
    }

    this.status = "connecting";
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.status = "open";
      handlers.onOpen?.();
    };
    this.ws.onclose = (event) => {
      this.status = "closed";
      handlers.onClose?.(event);
    };
    this.ws.onerror = (event) => {
      this.status = "error";
      handlers.onError?.(event);
    };
    this.ws.onmessage = (event) => {
      handlers.onMessage?.(event);
    };
  }

  reconnect(handlers: WsHandlers = {}) {
    if (!this.url) return;
    this.disconnect();
    this.connect(this.url, handlers);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (!this.ws || this.status !== "open") return;
    this.ws.send(data);
  }

  disconnect(code?: number, reason?: string) {
    if (!this.ws) return;
    this.ws.close(code, reason);
    this.ws = null;
  }
}
