import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

/**
 * Icon Container component
 * Reusable circular container for icons
 */
interface IconContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const IconContainer = forwardRef<HTMLDivElement, IconContainerProps>(
  ({ className, size = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full border border-casino-border flex items-center justify-center shrink-0",
          sizeMap[size],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

IconContainer.displayName = "IconContainer";

export { IconContainer };
