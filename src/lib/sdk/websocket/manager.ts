import type { AtomikConfig, WebSocketConfig } from "../env";
import { getApiConfig, getWebSocketConfig } from "../env";

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp?: string;
}

export interface CasinoStatsMessage extends WebSocketMessage {
  type: "casino_win" | "casino_stats";
  data: {
    totalGames: number;
    totalVolume: string;
    activeUsers: number;
    headsWins?: number;
    tailsWins?: number;
  };
}

export interface RecentWinMessage extends WebSocketMessage {
  type: "casino_win";
  data: {
    gameId: string;
    outcome: "heads" | "tails";
    amount: number;
    playerPubkey: string;
    timestamp: string;
  };
}

export interface BlockUpdateMessage extends WebSocketMessage {
  type: "new_block";
  data: {
    slot: number;
    blockTime: number;
    blockhash: string;
  };
}

export type AtomikWebSocketMessage =
  | CasinoStatsMessage
  | RecentWinMessage
  | BlockUpdateMessage;

type MessageHandler<T = unknown> = (data: T) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

/**
 * WebSocket connection wrapper with automatic reconnection
 */
export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private config: WebSocketConfig;
  private messageHandlers = new Map<string, MessageHandler<unknown>[]>();
  private errorHandlers: ErrorHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(url: string, config: WebSocketConfig) {
    this.url = url;
    this.config = config;
  }

  /**
   * Connect to the WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.isIntentionallyClosed = false;

        this.ws.onopen = () => {
          this.reconnectAttempt = 0;
          this.connectHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            const handlers = this.messageHandlers.get(message.type) || [];
            handlers.forEach((handler) => handler(message.data));
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          this.errorHandlers.forEach((handler) => handler(error));
          reject(new Error("WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          this.disconnectHandlers.forEach((handler) => handler());

          if (!this.isIntentionallyClosed && this.config.enabled) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to messages of a specific type
   */
  subscribe<T = unknown>(
    messageType: string,
    handler: MessageHandler<T>,
  ): () => void {
    const handlers = this.messageHandlers.get(messageType) || [];
    handlers.push(handler as MessageHandler<unknown>);
    this.messageHandlers.set(messageType, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.messageHandlers.get(messageType) || [];
      const index = currentHandlers.indexOf(handler as MessageHandler<unknown>);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        if (currentHandlers.length === 0) {
          this.messageHandlers.delete(messageType);
        } else {
          this.messageHandlers.set(messageType, currentHandlers);
        }
      }
    };
  }

  /**
   * Add connection event handlers
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.push(handler);
    return () => {
      const index = this.connectHandlers.indexOf(handler);
      if (index > -1) this.connectHandlers.splice(index, 1);
    };
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.push(handler);
    return () => {
      const index = this.disconnectHandlers.indexOf(handler);
      if (index > -1) this.disconnectHandlers.splice(index, 1);
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) this.errorHandlers.splice(index, 1);
    };
  }

  /**
   * Get current connection state
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get isConnecting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.config.reconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    const delay =
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt);
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      console.log(
        `Reconnecting to WebSocket (attempt ${this.reconnectAttempt})...`,
      );
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }
}

/**
 * WebSocket manager for handling multiple connections and message types
 */
export class AtomikWebSocketManager {
  private connections = new Map<string, WebSocketConnection>();
  private config: AtomikConfig;

  constructor(config: AtomikConfig) {
    this.config = config;
  }

  /**
   * Create or get a WebSocket connection
   */
  getConnection(name: string, url?: string): WebSocketConnection {
    if (!this.connections.has(name)) {
      const wsUrl = url || this.getDefaultWebSocketUrl();
      const wsConfig = getWebSocketConfig(this.config);
      const connection = new WebSocketConnection(wsUrl, wsConfig);
      this.connections.set(name, connection);
    }

    return this.connections.get(name)!;
  }

  /**
   * Connect to live casino data streams
   */
  async connectToCasinoStreams(): Promise<WebSocketConnection> {
    const wsConfig = getWebSocketConfig(this.config);
    if (!wsConfig.enabled) {
      throw new Error("WebSocket connections are disabled in configuration");
    }

    const baseUrl = this.getDefaultWebSocketUrl() + "/ws";
    const connection = this.getConnection("casino-stream", baseUrl);

    if (!connection.isConnected && !connection.isConnecting) {
      await connection.connect();
    }

    return connection;
  }

  /**
   * Disconnect all connections
   */
  disconnectAll(): void {
    this.connections.forEach((connection) => connection.disconnect());
    this.connections.clear();
  }

  /**
   * Get the default WebSocket URL from API config
   */
  private getDefaultWebSocketUrl(): string {
    const apiConfig = getApiConfig(this.config);
    return apiConfig.baseUrl.replace(/^http/, "ws");
  }
}

/**
 * Factory function to create a WebSocket manager
 */
export function createWebSocketManager(
  config: AtomikConfig,
): AtomikWebSocketManager {
  return new AtomikWebSocketManager(config);
}
