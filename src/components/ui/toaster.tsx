"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toast component using Sonner
 * Positioned at bottom-left to match SDK integration guide
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-left"
      toastOptions={{
        style: {
          background: "#131216",
          color: "rgba(255, 255, 255, 0.87)",
          border: "1px solid #1E2938",
        },
        className: "text-sm",
      }}
      richColors
    />
  );
}
