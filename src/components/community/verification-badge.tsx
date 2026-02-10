/**
 * Verification Badge Component
 * Visual badge showing verification status of community games
 */

'use client';

import { Check, Clock, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface VerificationBadgeProps {
  status: 'pending' | 'analyzing' | 'approved' | 'rejected' | 'suspended';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadge({
  status,
  size = 'md',
  onClick,
  showLabel = false,
  className,
}: VerificationBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: Check,
          label: 'Verified',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/30',
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/30',
        };
      case 'analyzing':
        return {
          icon: Clock,
          label: 'Analyzing',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/30',
        };
      case 'rejected':
        return {
          icon: X,
          label: 'Rejected',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/30',
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          label: 'Suspended',
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/30',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-8 w-8 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1',
        config.bgColor,
        config.textColor,
        config.borderColor,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
      title={config.label}
    >
      <Icon size={iconSizes[size]} className="flex-shrink-0" />
      {showLabel && (
        <span className={cn('font-medium whitespace-nowrap', sizeClasses[size])}>
          {config.label}
        </span>
      )}
    </div>
  );
}
