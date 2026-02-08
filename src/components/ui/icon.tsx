/**
 * Icon Component
 * Centralized SVG icon management with sprite sheet optimization
 */

import React from 'react';
import { logger } from '@/lib/logger';

interface IconProps {
  name: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const iconPaths = {
  user: '/icons/user.svg',
  coinflip: '/icons/coinflip.svg',
  sol: '/icons/sol.svg',
  wallet: '/icons/wallet.svg',
  downArrow: '/icons/downArrow.svg',
  game: '/icons/game.svg',
  'chevron-left-disabled': '/icons/chevron-left-disabled.svg',
  'chevron-right-enabled': '/icons/chevron-right-enabled.svg',
} as const;

export type IconName = keyof typeof iconPaths;

export const Icon = React.memo<IconProps>(({ 
  name, 
  width = 24, 
  height = 24, 
  className = '',
  style = { width: "auto", height: "auto" }
}) => {
  const iconPath = iconPaths[name as IconName];
  
  if (!iconPath) {
    logger.warn(`Icon "${name}" not found in iconPaths`);
    return null;
  }

  return (
    <img
      src={iconPath}
      alt={name}
      width={width}
      height={height}
      className={className}
      style={style}
      loading="lazy"
    />
  );
});

Icon.displayName = 'Icon';

// Export icon names for type safety
export const iconNames = Object.keys(iconPaths) as IconName[];