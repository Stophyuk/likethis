'use client';

import { ContentFactoryPlatform } from '@/types';
import { cn } from '@/lib/utils';

interface PlatformTabsProps {
  platforms: ContentFactoryPlatform[];
  activeTab: ContentFactoryPlatform;
  onTabChange: (platform: ContentFactoryPlatform) => void;
}

const platformInfo: Record<ContentFactoryPlatform, { emoji: string; name: string }> = {
  x: { emoji: '𝕏', name: 'X' },
  linkedin: { emoji: '💼', name: 'LinkedIn' },
  naver: { emoji: '📗', name: '네이버' },
  medium: { emoji: '📝', name: 'Medium' },
};

export function PlatformTabs({ platforms, activeTab, onTabChange }: PlatformTabsProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => onTabChange(platform)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeTab === platform
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {platformInfo[platform].emoji} {platformInfo[platform].name}
        </button>
      ))}
    </div>
  );
}
