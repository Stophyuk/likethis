'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArticleCard } from '@/components/content-factory/ArticleCard';
import {
  VibeCodingTheme,
  ContentFactoryPlatform,
  TargetAudience,
  GeneratedArticle,
  BulkArticleResponse,
  WeeklyTrendAnalysis,
} from '@/types';
import {
  vibeCodingBlocks,
  themeDisplayNames,
  getBlocksByTheme,
} from '@/lib/vibe-coding-content';
import { MessageSquare, TrendingUp, FileText, Check, ChevronDown, ChevronUp, Eye } from 'lucide-react';

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

// Trend analysis insight (converted from WeeklyTrendAnalysis)
interface TrendInsight {
  title: string;
  content: string;
  tags: string[];
  source: 'trend';
}

export default function ContentFactoryPage() {
  // Source selection
  const [storedInsights, setStoredInsights] = useState<StoredInsight[]>([]);
  const [trendInsights, setTrendInsights] = useState<TrendInsight[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<WeeklyTrendAnalysis | null>(null);
  const [useKakaoInsights, setUseKakaoInsights] = useState(true);
  const [useTrendInsights, setUseTrendInsights] = useState(true);
  const [useVibeCoding, setUseVibeCoding] = useState(true);
  const [selectedThemes, setSelectedThemes] = useState<VibeCodingTheme[]>([
    'intro',
    'benefits',
    'risks',
    'strategy',
    'execution',
    'conclusion',
  ]);

  // Preview states
  const [showKakaoPreview, setShowKakaoPreview] = useState(false);
  const [showTrendPreview, setShowTrendPreview] = useState(false);
  const [showVibeCodingPreview, setShowVibeCodingPreview] = useState(false);

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
      // Load Kakao insights
      const kakaoInsights: StoredInsight[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('kakao_analysis_')) {
          try {
            const data: StoredAnalysis = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.insights) {
              kakaoInsights.push(...data.insights);
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
            const existingTitles = new Set(kakaoInsights.map(i => i.title));
            data.insights.forEach(insight => {
              if (!existingTitles.has(insight.title)) {
                kakaoInsights.push(insight);
              }
            });
          }
        } catch {
          // Skip
        }
      }
      setStoredInsights(kakaoInsights);

      // Load trend analysis
      const trendData = localStorage.getItem('likethis_trend_analysis');
      if (trendData) {
        try {
          const analysis: WeeklyTrendAnalysis = JSON.parse(trendData);
          setTrendAnalysis(analysis);

          // Convert trend analysis to insights
          const insights: TrendInsight[] = [];

          // Add hot topics as insights
          if (analysis.hotTopics) {
            analysis.hotTopics.forEach(topic => {
              insights.push({
                title: topic.topic,
                content: topic.description,
                tags: topic.sources || [],
                source: 'trend',
              });
            });
          }

          // Add insights from analysis
          if (analysis.insights) {
            analysis.insights.forEach(insight => {
              insights.push({
                title: insight.title,
                content: insight.description,
                tags: insight.actionItems?.slice(0, 2) || [],
                source: 'trend',
              });
            });
          }

          setTrendInsights(insights);
        } catch {
          // Skip
        }
      }
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

    if (!useKakaoInsights && !useTrendInsights && !useVibeCoding) {
      setError('최소 1개 소스를 선택하세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare insights from both sources
      const insightsToUse: Array<{
        id: string;
        title: string;
        content: string;
        tags: string[];
        sourceQuotes?: string[];
      }> = [];

      // Add Kakao insights
      if (useKakaoInsights && storedInsights.length > 0) {
        storedInsights.forEach((insight, idx) => {
          insightsToUse.push({
            id: `kakao-${idx}`,
            title: insight.title,
            content: insight.content,
            tags: insight.tags,
            sourceQuotes: insight.sourceQuotes,
          });
        });
      }

      // Add trend insights
      if (useTrendInsights && trendInsights.length > 0) {
        trendInsights.forEach((insight, idx) => {
          insightsToUse.push({
            id: `trend-${idx}`,
            title: insight.title,
            content: insight.content,
            tags: insight.tags,
            sourceQuotes: [],
          });
        });
      }

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

      {/* Source Selection - Toggle Cards */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          📚 소스 선택
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Kakao Insights Card */}
          <Card
            className={`cursor-pointer transition-all ${
              useKakaoInsights
                ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400'
                : 'border-gray-200 hover:border-yellow-300'
            }`}
            onClick={() => setUseKakaoInsights(!useKakaoInsights)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${useKakaoInsights ? 'bg-yellow-200' : 'bg-gray-100'}`}>
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">카카오 인사이트</h3>
                    <p className="text-sm text-gray-500">{storedInsights.length}개</p>
                  </div>
                </div>
                {useKakaoInsights && <Check className="w-5 h-5 text-yellow-600" />}
              </div>
              {storedInsights.length === 0 ? (
                <p className="text-xs text-amber-600 mt-3">
                  카톡 분석 결과 없음
                </p>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowKakaoPreview(!showKakaoPreview); }}
                  className="text-xs text-blue-600 mt-3 flex items-center gap-1 hover:underline"
                >
                  <Eye className="w-3 h-3" />
                  {showKakaoPreview ? '미리보기 닫기' : '미리보기'}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Trend Insights Card */}
          <Card
            className={`cursor-pointer transition-all ${
              useTrendInsights
                ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setUseTrendInsights(!useTrendInsights)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${useTrendInsights ? 'bg-blue-200' : 'bg-gray-100'}`}>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">트렌드 인사이트</h3>
                    <p className="text-sm text-gray-500">{trendInsights.length}개</p>
                  </div>
                </div>
                {useTrendInsights && <Check className="w-5 h-5 text-blue-600" />}
              </div>
              {trendInsights.length === 0 ? (
                <p className="text-xs text-amber-600 mt-3">
                  트렌드 분석 결과 없음
                </p>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTrendPreview(!showTrendPreview); }}
                  className="text-xs text-blue-600 mt-3 flex items-center gap-1 hover:underline"
                >
                  <Eye className="w-3 h-3" />
                  {showTrendPreview ? '미리보기 닫기' : '미리보기'}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Vibe Coding Card */}
          <Card
            className={`cursor-pointer transition-all ${
              useVibeCoding
                ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-400'
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => setUseVibeCoding(!useVibeCoding)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${useVibeCoding ? 'bg-purple-200' : 'bg-gray-100'}`}>
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">바이브코딩 보고서</h3>
                    <p className="text-sm text-gray-500">{vibeCodingBlocks.length}개 블록</p>
                  </div>
                </div>
                {useVibeCoding && <Check className="w-5 h-5 text-purple-600" />}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowVibeCodingPreview(!showVibeCodingPreview); }}
                className="text-xs text-blue-600 mt-3 flex items-center gap-1 hover:underline"
              >
                <Eye className="w-3 h-3" />
                {showVibeCodingPreview ? '미리보기 닫기' : '미리보기'}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Kakao Preview */}
        {showKakaoPreview && storedInsights.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">카카오 인사이트 미리보기</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {storedInsights.slice(0, 5).map((insight, idx) => (
                <div key={idx} className="text-sm bg-white p-2 rounded border">
                  <span className="font-medium">{insight.title}</span>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{insight.content}</p>
                </div>
              ))}
              {storedInsights.length > 5 && (
                <p className="text-xs text-yellow-600">+{storedInsights.length - 5}개 더...</p>
              )}
            </div>
          </div>
        )}

        {/* Trend Preview */}
        {showTrendPreview && trendInsights.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">트렌드 인사이트 미리보기</h4>
            {trendAnalysis?.summary && (
              <p className="text-sm text-blue-700 mb-3">{trendAnalysis.summary}</p>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trendInsights.slice(0, 5).map((insight, idx) => (
                <div key={idx} className="text-sm bg-white p-2 rounded border">
                  <span className="font-medium">{insight.title}</span>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{insight.content}</p>
                </div>
              ))}
              {trendInsights.length > 5 && (
                <p className="text-xs text-blue-600">+{trendInsights.length - 5}개 더...</p>
              )}
            </div>
          </div>
        )}

        {/* Vibe Coding Preview & Theme Selection */}
        {showVibeCodingPreview && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-800 mb-2">바이브코딩 테마 선택</h4>
            <div className="flex items-center gap-2 text-sm mb-3">
              <span className="text-gray-600">테마:</span>
              <button
                onClick={selectAllThemes}
                className="text-purple-600 hover:underline"
              >
                전체 선택
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(themeDisplayNames) as [VibeCodingTheme, string][]).map(
                ([theme, name]) => (
                  <button
                    key={theme}
                    onClick={() => toggleTheme(theme)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedThemes.includes(theme)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border hover:border-purple-400'
                    }`}
                  >
                    {name}
                  </button>
                )
              )}
            </div>
          </div>
        )}
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
