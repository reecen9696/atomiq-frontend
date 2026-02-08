import { cn } from "@/lib/cn";

interface GradientOverlayProps {
  /**
   * Position of the gradient overlay
   * @default "right"
   */
  position?: "left" | "right" | "top" | "bottom";
  
  /**
   * Width (for left/right) or height (for top/bottom) of the gradient
   * @default "w-24" for horizontal, "h-24" for vertical
   */
  size?: string;
  
  /**
   * Custom className for additional styling
   */
  className?: string;
  
  /**
   * Z-index value
   * @default "z-10"
   */
  zIndex?: string;
}

/**
 * GradientOverlay Component
 * Creates a gradient fade effect typically used for carousels and scrollable containers
 * 
 * @example
 * // Right fade for horizontal carousel
 * <GradientOverlay position="right" size="w-24" />
 * 
 * @example
 * // Bottom fade for vertical scroll
 * <GradientOverlay position="bottom" size="h-32" />
 */
export function GradientOverlay({
  position = "right",
  size,
  className,
  zIndex = "z-10",
}: GradientOverlayProps) {
  const positionClasses = {
    right: "right-0 top-0 bottom-0",
    left: "left-0 top-0 bottom-0",
    top: "top-0 left-0 right-0",
    bottom: "bottom-0 left-0 right-0",
  };

  const gradientDirections = {
    right: "bg-gradient-to-l",
    left: "bg-gradient-to-r",
    top: "bg-gradient-to-b",
    bottom: "bg-gradient-to-t",
  };

  const defaultSize = position === "left" || position === "right" ? "w-24" : "h-24";

  return (
    <div
      className={cn(
        "absolute pointer-events-none",
        positionClasses[position],
        gradientDirections[position],
        "from-[#0F0E11] to-transparent",
        size || defaultSize,
        zIndex,
        className
      )}
      aria-hidden="true"
    />
  );
}
