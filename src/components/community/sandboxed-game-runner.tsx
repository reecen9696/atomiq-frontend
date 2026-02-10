/**
 * Sandboxed Game Runner Component
 * Renders community games in a secure sandboxed iframe
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';
import type { CommunityGameConfig } from '@/types/community-games';
import { COMMUNITY_GAME_SECURITY } from '@/config/community-security';
import { VerificationBadge } from './verification-badge';

interface SandboxedGameRunnerProps {
  game: CommunityGameConfig;
}

export function SandboxedGameRunner({ game }: SandboxedGameRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKilled, setIsKilled] = useState(false);

  useEffect(() => {
    // Setup postMessage communication
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (!event.origin.includes(window.location.origin)) {
        console.warn('Blocked message from untrusted origin:', event.origin);
        return;
      }

      // Handle SDK requests from the game
      const { type, payload } = event.data;

      switch (type) {
        case 'SDK_READY':
          console.log('Game SDK initialized');
          break;
        case 'VRF_REQUEST':
          handleVRFRequest(payload);
          break;
        case 'BET_PLACED':
          handleBetPlaced(payload);
          break;
        case 'BET_SETTLED':
          handleBetSettled(payload);
          break;
        default:
          console.log('Unknown message type:', type);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleVRFRequest = (payload: any) => {
    // In real implementation, this would call the backend VRF service
    console.log('VRF Request:', payload);
    
    // Mock response
    const vrfResult = {
      output: '0x' + Math.random().toString(16).substr(2),
      proof: '0xproof...',
      inputMessage: payload.betId,
      randomNumber: Math.random(),
    };

    iframeRef.current?.contentWindow?.postMessage(
      { type: 'VRF_RESPONSE', payload: vrfResult },
      '*'
    );
  };

  const handleBetPlaced = (payload: any) => {
    // In real implementation, this would call the backend bet service
    console.log('Bet Placed:', payload);
  };

  const handleBetSettled = (payload: any) => {
    // In real implementation, this would call the backend settlement service
    console.log('Bet Settled:', payload);
  };

  const handleKillSwitch = () => {
    setIsKilled(true);
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError('Failed to load game. Please try again later.');
    setIsLoading(false);
  };

  if (isKilled) {
    return (
      <div className="flex h-full min-h-[600px] items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 p-8">
        <div className="text-center">
          <X size={48} className="mx-auto mb-4 text-red-400" />
          <h3 className="mb-2 text-xl font-bold text-white">Game Stopped</h3>
          <p className="text-white/60">
            The game has been stopped for security reasons.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[600px] items-center justify-center rounded-lg border border-casino-border bg-casino-card p-8">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-400" />
          <h3 className="mb-2 text-xl font-bold text-white">Error Loading Game</h3>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Community Game Badge */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-primary-purple/30 bg-primary-purple/5 p-4">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-primary-purple" />
          <div>
            <h3 className="text-sm font-semibold text-white">Community Game</h3>
            <p className="text-xs text-white/60">
              Running in secure sandbox • Verified by platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VerificationBadge status={game.verificationStatus} size="sm" showLabel />
          <button
            onClick={handleKillSwitch}
            className="rounded-sm bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
            title="Emergency stop"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Game iframe */}
      <div className="relative min-h-[600px] overflow-hidden rounded-lg border border-casino-border bg-casino-bg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-purple border-r-transparent" />
              <p className="text-white/60">Loading game...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={game.bundleUrl}
          sandbox={COMMUNITY_GAME_SECURITY.SANDBOX_ATTRS}
          className="h-full min-h-[600px] w-full"
          onLoad={handleLoad}
          onError={handleError}
          title={game.title}
        />
      </div>

      {/* Security info */}
      <div className="mt-4 rounded-sm border border-casino-border bg-casino-card p-3 text-xs text-white/60">
        <p>
          <strong className="text-white/80">Security:</strong> This game runs in a
          sandboxed environment with restricted access. All randomness is provided by
          the platform's VRF system. Bundle hash: {game.bundleHash.substring(0, 32)}...
        </p>
      </div>
    </div>
  );
}
