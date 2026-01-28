import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  /** Default: max-w-360 (1440px) */
  width?: "default" | "narrow";
  /** Default: responsive horizontal padding */
  padding?: "default" | "none";
};

export function Container({
  children,
  className,
  asChild,
  width = "default",
  padding = "default",
}: ContainerProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "mx-auto w-full",
        width === "default" ? "max-w-360" : "max-w-7xl",
        padding === "default" ? "px-4 sm:px-6 lg:px-10 2xl:px-12" : "px-0",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
