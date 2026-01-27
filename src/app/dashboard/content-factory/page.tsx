'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/content-factory/ArticleCard';
import {
  VibeCodingTheme,
  ContentFactoryPlatform,
  TargetAudience,
  GeneratedArticle,
  BulkArticleResponse,
} from '@/types';
import {
  vibeCodingBlocks,
  themeDisplayNames,
  getBlocksByTheme,
} from '@/lib/vibe-coding-content';

interface StoredInsight {
  category: string;
  title: string;
  content: string;
  tags: string[];
  sourceQuotes?: string[];
}

interface StoredAnalysis {
  insights?: StoredInsight[];
  roomName?: string;
  analyzedAt?: string;
}

export default function ContentFactoryPage() {
  // Source selection
  const [storedInsights, setStoredInsights] = useState<StoredInsight[]>([]);
  const [useInsights, setUseInsights] = useState(true);
  const [useVibeCoding, setUseVibeCoding] = useState(true);
  const [selectedThemes, setSelectedThemes] = useState<VibeCodingTheme[]>([
    'intro',
    'benefits',
    'risks',
    'strategy',
    'execution',
    'conclusion',
  ]);

  // Settings
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('general');
  const [articleCount, setArticleCount] = useState(5);
  const [selectedPlatforms, setSelectedPlatforms] = useState<ContentFactoryPlatform[]>([
    'x',
    'linkedin',
    'naver',
    'medium',
  ]);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load insights from localStorage
  useEffect(() => {
    const loadInsights = () => {
      const insights: StoredInsight[] = [];

      // Check for recent analysis in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('kakao_analysis_')) {
          try {
            const data: StoredAnalysis = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.insights) {
              insights.push(...data.insights);
            }
          } catch {
            // Skip invalid entries
          }
        }
      }

      // Also check for the latest analysis
      const latestAnalysis = localStorage.getItem('likethis_latest_kakao_analysis');
      if (latestAnalysis) {
        try {
          const data: StoredAnalysis = JSON.parse(latestAnalysis);
          if (data.insights) {
            // Avoid duplicates
            const existingTitles = new Set(insights.map(i => i.title));
            data.insights.forEach(insight => {
              if (!existingTitles.has(insight.title)) {
                insights.push(insight);
              }
            });
          }
        } catch {
          // Skip
        }
      }

      setStoredInsights(insights);
    };

    loadInsights();
  }, []);

  const toggleTheme = (theme: VibeCodingTheme) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const togglePlatform = (platform: ContentFactoryPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const selectAllThemes = () => {
    setSelectedThemes(['intro', 'benefits', 'risks', 'strategy', 'execution', 'conclusion']);
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0) {
      setError('최소 1개 플랫폼을 선택하세요.');
      return;
    }

    if (!useInsights && !useVibeCoding) {
      setError('최소 1개 소스를 선택하세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare insights
      const insightsToUse = useInsights
        ? storedInsights.map((insight, idx) => ({
            id: String(idx),
            title: insight.title,
            content: insight.content,
            tags: insight.tags,
            sourceQuotes: insight.sourceQuotes,
          }))
        : [];

      // If no insights, add a placeholder
      if (insightsToUse.length === 0 && useVibeCoding) {
        insightsToUse.push({
          id: '0',
          title: '바이브코딩 트렌드',
          content: 'AI를 활용한 새로운 개발 패러다임이 등장하면서 비전공자도 앱을 만들 수 있게 되었다.',
          tags: ['바이브코딩', 'AI', '개발'],
          sourceQuotes: [],
        });
      }

      // Prepare selected blocks
      const selectedBlocks = useVibeCoding
        ? selectedThemes.flatMap(theme => getBlocksByTheme(theme).map(b => b.id))
        : [];

      const response = await fetch('/api/generate-bulk-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights: insightsToUse,
          selectedBlocks,
          targetPlatforms: selectedPlatforms,
          targetAudience,
          articleCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate articles');
      }

      const data: BulkArticleResponse = await response.json();
      setArticles(data.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : '글감 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 팩토리</h1>
        <p className="text-gray-600 mt-1">
          카카오 인사이트와 바이브코딩 문서를 조합해 커뮤니티 글감을 대량 생성합니다.
        </p>
      </div>

      {/* Source Selection */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          📚 소스 선택
        </h2>

        {/* Insights */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useInsights}
              onChange={(e) => setUseInsights(e.target.checked)}
              className="rounded"
            />
            <span>카카오 인사이트</span>
            <span className="text-sm text-gray-500">
              ({storedInsights.length}개)
            </span>
          </label>
          {storedInsights.length === 0 && (
            <p className="text-sm text-amber-600 ml-6">
              카톡 분석 결과가 없습니다. 카톡 메뉴에서 먼저 분석을 진행하세요.
            </p>
          )}
        </div>

        {/* Vibe Coding */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useVibeCoding}
              onChange={(e) => setUseVibeCoding(e.target.checked)}
              className="rounded"
            />
            <span>바이브코딩 보고서</span>
            <span className="text-sm text-gray-500">
              ({vibeCodingBlocks.length}개 블록)
            </span>
          </label>

          {useVibeCoding && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">테마 선택:</span>
                <button
                  onClick={selectAllThemes}
                  className="text-blue-600 hover:underline"
                >
                  전체
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(themeDisplayNames) as [VibeCodingTheme, string][]).map(
                  ([theme, name]) => (
                    <label key={theme} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedThemes.includes(theme)}
                        onChange={() => toggleTheme(theme)}
                        className="rounded"
                      />
                      <span className="text-sm">{name}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          ⚙️ 설정
        </h2>

        {/* Target Audience */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">타겟 독자</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="audience"
                checked={targetAudience === 'general'}
                onChange={() => setTargetAudience('general')}
              />
              <span>일반인 (비개발자)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="audience"
                checked={targetAudience === 'developer'}
                onChange={() => setTargetAudience('developer')}
              />
              <span>개발자</span>
            </label>
          </div>
        </div>

        {/* Article Count */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">글감 수</label>
          <input
            type="number"
            min={1}
            max={10}
            value={articleCount}
            onChange={(e) => setArticleCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
            className="w-20 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Platforms */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">플랫폼</label>
          <div className="flex flex-wrap gap-3">
            {([
              { id: 'x' as const, label: '𝕏 X' },
              { id: 'linkedin' as const, label: '💼 LinkedIn' },
              { id: 'naver' as const, label: '📗 네이버 블로그' },
              { id: 'medium' as const, label: '📝 Medium' },
            ]).map(({ id, label }) => (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(id)}
                  onChange={() => togglePlatform(id)}
                  className="rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              생성 중...
            </span>
          ) : (
            '✨ 글감 대량 생성'
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      {articles.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">
            생성된 글감 ({articles.length}개)
          </h2>
          <div className="space-y-4">
            {articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
