'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeneratedArticle, ContentFactoryPlatform } from '@/types';
import { Button } from '@/components/ui/button';
import { PlatformTabs } from './PlatformTabs';

interface ArticleCardProps {
  article: GeneratedArticle;
  index: number;
}

export function ArticleCard({ article, index }: ArticleCardProps) {
  const router = useRouter();
  const platforms = article.platformContents.map(pc => pc.platform);
  const [activeTab, setActiveTab] = useState<ContentFactoryPlatform>(platforms[0]);
  const [copied, setCopied] = useState(false);

  const activeContent = article.platformContents.find(pc => pc.platform === activeTab);

  const handleCopy = async () => {
    if (!activeContent) return;
    const textToCopy = `${activeContent.content}\n\n${activeContent.hashtags.map(h => `#${h}`).join(' ')}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToCompose = () => {
    // Store article data in localStorage for compose page
    localStorage.setItem('likethis_compose_topic', JSON.stringify({
      topic: article.title,
      keyPoints: `${article.hook}\n\n${article.angle}\n\n${activeContent?.content || ''}`,
    }));
    router.push('/dashboard/compose');
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">글감 {index + 1}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {article.angle}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">{article.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{article.hook}</p>
        </div>
      </div>

      {/* Source info */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {article.sourceInsightIds.length > 0 && (
          <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">
            인사이트 #{article.sourceInsightIds.join(', #')}
          </span>
        )}
        {article.sourceBlockIds.length > 0 && (
          <span className="px-2 py-1 bg-green-50 text-green-600 rounded">
            문서: {article.sourceBlockIds.join(', ')}
          </span>
        )}
      </div>

      {/* Platform tabs */}
      {platforms.length > 0 && (
        <PlatformTabs
          platforms={platforms}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Content */}
      {activeContent && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="whitespace-pre-wrap text-sm text-gray-800 mb-3">
            {activeContent.content}
          </div>
          <div className="flex flex-wrap gap-1">
            {activeContent.hashtags.map((tag, i) => (
              <span key={i} className="text-xs text-blue-600">
                #{tag}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {activeContent.characterCount}자
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? '복사됨!' : '복사'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleGoToCompose}>
          Compose로 이동
        </Button>
      </div>
    </div>
  );
}
