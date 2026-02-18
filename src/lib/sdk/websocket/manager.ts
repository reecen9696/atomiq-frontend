import type { AtomikConfig, WebSocketConfig } from "../env";
import { getApiConfig, getWebSocketConfig } from "../env";
import { logger } from "@/lib/logger";

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

export interface BlockUpdateMessage {
  type: "new_block";
  height: number;
  hash: string;
  tx_count: number;
  timestamp: number;
}

export interface SettlementFailedMessage {
  type: "settlement_failed";
  transaction_id: number;
  player_address: string;
  game_type: string;
  bet_amount: number;
  token: string;
  error_message: string;
  retry_count: number;
  is_permanent: boolean;
  timestamp: number;
}

export type AtomikWebSocketMessage =
  | CasinoStatsMessage
  | RecentWinMessage
  | BlockUpdateMessage
  | SettlementFailedMessage;

type MessageHandler<T = unknown> = (data: T) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;
type ConnectionStateHandler = (state: ConnectionState) => void;

export type ConnectionState = "connected" | "connecting" | "disconnected" | "reconnecting";

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
  private connectionStateHandlers: ConnectionStateHandler[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private connectionState: ConnectionState = "disconnected";
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds cap

  constructor(url: string, config: WebSocketConfig) {
    this.url = url;
    this.config = config;
  }

  /**
   * Update connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      logger.websocket("Connection state changed", { state });
      this.connectionStateHandlers.forEach((handler) => handler(state));
    }
  }

  /**
   * Connect to the WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState("connecting");
        this.ws = new WebSocket(this.url);
        this.isIntentionallyClosed = false;

        this.ws.onopen = () => {
          logger.websocket("WebSocket connected", { url: this.url });
          this.reconnectAttempt = 0;
          this.setConnectionState("connected");
          this.startHeartbeat();
          this.connectHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Update heartbeat timestamp on any message
            this.lastHeartbeat = Date.now();

            // Filter out heartbeat messages from console logs
            if (message.type !== "heartbeat") {
              logger.websocket("Message received", { type: message.type, message });
            }

            // Handle flat message structure from backend (not nested with data property)
            const handlers = this.messageHandlers.get(message.type) || [];
            handlers.forEach((handler) => handler(message));
          } catch (error) {
            logger.error("Failed to parse WebSocket message", error);
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error", { error, url: this.url });
          this.errorHandlers.forEach((handler) => handler(error));
          // Don't reject here if already connected - let onclose handle it
          if (this.connectionState === "connecting") {
            this.setConnectionState("disconnected");
            reject(new Error("WebSocket connection failed"));
          }
        };

        this.ws.onclose = (event) => {
          logger.websocket("WebSocket closed", { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          
          this.stopHeartbeat();
          this.disconnectHandlers.forEach((handler) => handler());

          if (!this.isIntentionallyClosed && this.config.enabled) {
            this.setConnectionState("reconnecting");
            this.scheduleReconnect();
          } else {
            this.setConnectionState("disconnected");
          }
        };
      } catch (error) {
        this.setConnectionState("disconnected");
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

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState("disconnected");
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

  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.push(handler);
    // Immediately notify of current state
    handler(this.connectionState);
    return () => {
      const index = this.connectionStateHandlers.indexOf(handler);
      if (index > -1) this.connectionStateHandlers.splice(index, 1);
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

  get currentState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.config.reconnectAttempts) {
      logger.error("Max reconnection attempts reached", { attempts: this.reconnectAttempt });
      this.setConnectionState("disconnected");
      return;
    }

    // Exponential backoff with cap at MAX_RECONNECT_DELAY (30s)
    const baseDelay = this.config.reconnectDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempt);
    const delay = Math.min(exponentialDelay, this.MAX_RECONNECT_DELAY);
    
    this.reconnectAttempt++;

    logger.websocket("Scheduling reconnection", { 
      attempt: this.reconnectAttempt, 
      delayMs: delay 
    });

    this.reconnectTimer = setTimeout(() => {
      logger.websocket("Attempting reconnection", { attempt: this.reconnectAttempt });
      this.connect().catch((error) => {
        logger.error("Reconnection failed", error);
      });
    }, delay);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();
    
    // Check heartbeat every 30 seconds (reconnect if no messages for 60s)
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      
      // If no message received in 60 seconds, consider connection stale
      if (timeSinceLastHeartbeat > 60000) {
        logger.warn("Heartbeat timeout - no messages received", {
          timeSinceLastHeartbeat,
        });
        
        // Close and reconnect
        if (this.ws) {
          this.ws.close();
        }
      }
    }, 30000);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
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
  async connectToCasinoStreams(
    walletAddress?: string,
  ): Promise<WebSocketConnection> {
    const wsConfig = getWebSocketConfig(this.config);
    if (!wsConfig.enabled) {
      throw new Error("WebSocket connections are disabled in configuration");
    }

    // Build query parameters for settlement notifications
    const params = new URLSearchParams();
    params.append("casino", "true");
    params.append("blocks", "true");

    // Add settlement parameters when wallet address is provided
    if (walletAddress) {
      params.append("settlements", "true");
      params.append("wallet_address", walletAddress);
    }

    const baseUrl = this.getDefaultWebSocketUrl() + `/ws?${params.toString()}`;
    logger.debug("🔌 WebSocket connection", { 
      url: baseUrl,
      settlementsEnabled: !!walletAddress 
    });

    const connectionName = walletAddress
      ? `casino-stream-${walletAddress}`
      : "casino-stream";
    const connection = this.getConnection(connectionName, baseUrl);

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
