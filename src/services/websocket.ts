import { env } from "@/config";
import { logger } from "@/lib/logger";

/**
 * WebSocket Service
 * Real-time connection management for live updates
 */

type EventHandler = (data: unknown) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (!env.enableWebSocket) {
      logger.warn("WebSocket is disabled in environment config");
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(env.wsUrl);
      this.setupEventListeners();
    } catch (error) {
      logger.error("WebSocket connection failed", { error });
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Send message to WebSocket server
   */
  send(event: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      logger.warn("WebSocket is not connected");
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.websocket("WebSocket connected");
      this.reconnectAttempts = 0;
      this.emit("connect", null);
    };

    this.ws.onclose = () => {
      logger.websocket("WebSocket disconnected");
      this.emit("disconnect", null);
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      logger.error("WebSocket error", { error });
      this.emit("error", error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message.event, message.data);
      } catch (error) {
        logger.error("Failed to parse WebSocket message", { error });
      }
    };
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("Max reconnection attempts reached", { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.websocket("Reconnecting", {
      delay,
      attempt: this.reconnectAttempts,
    });
    setTimeout(() => this.connect(), delay);
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// Auto-connect in browser environment (not during SSR)
if (typeof window !== "undefined" && env.enableWebSocket) {
  wsService.connect();
}
