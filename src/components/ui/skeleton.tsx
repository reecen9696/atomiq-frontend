import { cn } from "@/lib/utils";

function shimmerClassName(isUpdating?: boolean, isStatic?: boolean) {
  if (isStatic) {
    // Static skeleton for empty states - no animation
    return cn(
      "relative overflow-hidden rounded-md bg-white/5",
    );
  }
  
  return cn(
    "relative overflow-hidden rounded-md bg-white/5",
    "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
    isUpdating
      ? "before:animate-[shimmer_1.4s_ease-in-out_infinite]"
      : "before:animate-[shimmer_1.1s_ease-in-out_infinite]",
  );
}

export function Skeleton({
  className,
  isUpdating,
  isStatic,
}: {
  className?: string;
  isUpdating?: boolean;
  isStatic?: boolean;
}) {
  return <div className={cn(shimmerClassName(isUpdating, isStatic), className)} />;
}
