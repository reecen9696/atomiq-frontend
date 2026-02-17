"use client";

import { useEffect, useState, useRef } from "react";

interface PageLoadingOverlayProps {
  isLoading: boolean;
}

/**
 * Full-screen loading overlay shown during initial page load
 * while data is being fetched from the blockchain
 */
export function PageLoadingOverlay({ isLoading }: PageLoadingOverlayProps) {
  const [show, setShow] = useState(isLoading);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // Add a small delay before hiding to ensure smooth transition
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Dynamically create the dotlottie-player element
  useEffect(() => {
    if (playerRef.current && !playerRef.current.querySelector('dotlottie-player')) {
      const player = document.createElement('dotlottie-player');
      player.setAttribute('src', '/assets/animations/loading.lottie');
      player.setAttribute('autoplay', '');
      player.setAttribute('loop', '');
      player.style.width = '100%';
      player.style.height = '100%';
      playerRef.current.appendChild(player);
    }
  }, []);

  if (!show) return null;

  return (
    <>
      {/* Background overlay with opacity */}
      <div
        className={`fixed inset-0 z-9999 transition-opacity duration-300 ${
          isLoading ? "opacity-60" : "opacity-0"
        }`}
        style={{ backgroundColor: "#100E11" }}
      />
      
      {/* Animation container (full opacity) */}
      <div
        className={`fixed inset-0 z-10000 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-64 h-64 relative" ref={playerRef} />
      </div>
    </>
  );
}
