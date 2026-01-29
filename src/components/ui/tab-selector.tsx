/**
 * Tab Selector Component
 * Reusable component for tab navigation
 */

import React from 'react';
import { colors } from '@/design-system/tokens';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabSelectorProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabSelector = React.memo<TabSelectorProps>(({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  const handleTabClick = React.useCallback((tabId: string, disabled?: boolean) => {
    if (!disabled) {
      onTabChange(tabId);
    }
  }, [onTabChange]);

  return (
    <div 
      className={`p-2 rounded-sm flex gap-1 w-full md:w-fit ${className}`}
      style={{ backgroundColor: colors.casino.bgSecondary }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            disabled={tab.disabled}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-200 ${
              tab.disabled 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            style={{
              backgroundColor: isActive ? colors.casino.bgTertiary : 'transparent',
              color: isActive ? colors.text.primary : colors.text.secondary
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});

TabSelector.displayName = 'TabSelector';