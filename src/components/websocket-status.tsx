"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createWebSocketManager } from "@/lib/sdk/websocket/manager";
import type { ConnectionState } from "@/lib/sdk/websocket/manager";
import { createAtomikConfig } from "@/lib/sdk";

/**
 * WebSocket connection status indicator for development mode
 * Shows current connection state in a small overlay
 */
export function WebSocketStatus() {
  const { publicKey } = useWallet();
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    setIsVisible(true);

    if (!publicKey) {
      setConnectionState("disconnected");
      return;
    }

    const config = createAtomikConfig();
    const manager = createWebSocketManager(config);
    let cleanupFn: (() => void) | undefined;

    const initConnection = async () => {
      try {
        const connection = await manager.connectToCasinoStreams(
          publicKey.toBase58(),
        );

        // Subscribe to connection state changes
        const unsubscribe = connection.onConnectionStateChange((state) => {
          setConnectionState(state);
        });

        cleanupFn = () => {
          unsubscribe();
          manager.disconnectAll();
        };
      } catch (error) {
        console.error("Failed to initialize WebSocket status monitor", error);
        setConnectionState("disconnected");
      }
    };

    initConnection();

    return () => {
      cleanupFn?.();
    };
  }, [publicKey]);

  // Don't render in production or if not visible
  if (!isVisible) {
    return null;
  }

  const getStateColor = () => {
    switch (connectionState) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "reconnecting":
        return "bg-orange-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStateText = () => {
    switch (connectionState) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
        <div className={`w-2 h-2 rounded-full ${getStateColor()} animate-pulse`} />
        <span className="text-xs text-white/80 font-medium">
          WS: {getStateText()}
        </span>
      </div>
    </div>
  );
}
