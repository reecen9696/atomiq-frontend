interface LiveStatusIndicatorProps {
  isConnected: boolean;
  isConnecting?: boolean;
  className?: string;
}

export function LiveStatusIndicator({
  isConnected,
  isConnecting = false,
  className = "",
}: LiveStatusIndicatorProps) {
  const getStatusConfig = () => {
    if (isConnecting) {
      return {
        color: "bg-yellow-500",
        text: "Connecting...",
        animation: "animate-pulse",
      };
    }

    if (isConnected) {
      return {
        color: "bg-green-500",
        text: "Live",
        animation: "animate-pulse",
      };
    }

    return {
      color: "bg-red-500",
      text: "Offline",
      animation: "",
    };
  };

  const status = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${status.color} ${status.animation}`}
      />
      <span className="text-xs font-medium text-white/80">{status.text}</span>
    </div>
  );
}
