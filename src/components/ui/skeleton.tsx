import { cn } from "@/lib/utils";

function shimmerClassName(isUpdating?: boolean) {
  return cn(
    "relative overflow-hidden rounded-md bg-white/5",
    "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
    isUpdating
      ? "before:animate-[shimmer_1.4s_ease-in-out_infinite]"
      : "before:animate-[shimmer_1.1s_ease-in-out_infinite]"
  );
}

export function Skeleton({
  className,
  isUpdating
}: {
  className?: string;
  isUpdating?: boolean;
}) {
  return <div className={cn(shimmerClassName(isUpdating), className)} />;
}
