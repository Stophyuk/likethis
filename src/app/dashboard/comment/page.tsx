'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Check, Sparkles, MessageSquare, Lightbulb } from 'lucide-react'

const COMMUNITIES = [
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
  { id: 'hackernews', name: 'Hacker News', icon: '🔶' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'disquiet', name: 'Disquiet', icon: '🚀' },
  { id: 'producthunt', name: 'Product Hunt', icon: '🐱' },
  { id: 'naver', name: '네이버', icon: '🟢' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'general', name: '기타 커뮤니티', icon: '💬' },
]

const COMMENT_TONES = [
  { id: 'friendly', name: '친근하게', emoji: '😊' },
  { id: 'professional', name: '전문적으로', emoji: '💼' },
  { id: 'curious', name: '호기심 있게', emoji: '🤔' },
  { id: 'supportive', name: '응원하며', emoji: '💪' },
  { id: 'humorous', name: '유머러스하게', emoji: '😄' },
]

interface CommentSuggestion {
  type: string
  content: string
  reason: string
}

interface GenerateResult {
  postSummary: string
  comments: CommentSuggestion[]
  tips: string[]
}

export default function CommentPage() {
  const [community, setCommunity] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [postContent, setPostContent] = useState('')
  const [commentTone, setCommentTone] = useState('friendly')
  const [userContext, setUserContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (!community || !postContent.trim()) {
      alert('커뮤니티와 게시글 내용을 입력해주세요.')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community,
          postContent,
          postUrl: postUrl.trim() || undefined,
          commentTone: COMMENT_TONES.find(t => t.id === commentTone)?.name,
          userContext: userContext.trim() || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Generate error:', error)
      alert('댓글 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (index: number, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '공감': 'bg-pink-100 text-pink-700',
      '질문': 'bg-blue-100 text-blue-700',
      '정보추가': 'bg-green-100 text-green-700',
      '경험공유': 'bg-purple-100 text-purple-700',
      '칭찬': 'bg-yellow-100 text-yellow-700',
      '피드백': 'bg-orange-100 text-orange-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">댓글 추천</h1>
        <p className="text-gray-600 mt-2">
          게시글에 어떤 댓글을 달면 좋을지 AI가 추천해드립니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 입력 영역 */}
        <div className="space-y-4">
          {/* 커뮤니티 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">커뮤니티 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMUNITIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCommunity(c.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      community === c.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 게시글 입력 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">게시글 정보</CardTitle>
              <CardDescription>URL이나 내용 중 하나만 입력해도 됩니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  게시글 URL (선택)
                </label>
                <Input
                  placeholder="https://..."
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  게시글 내용 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="게시글 내용을 복사해서 붙여넣으세요..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* 톤 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">댓글 톤</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COMMENT_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setCommentTone(tone.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      commentTone === tone.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tone.emoji} {tone.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 추가 컨텍스트 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">내 정보 (선택)</CardTitle>
              <CardDescription>댓글에 반영할 내 배경/관심사</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="예: 3년차 프론트엔드 개발자, React 주로 사용, 사이드프로젝트에 관심 많음"
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* 생성 버튼 */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !community || !postContent.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                댓글 추천받기
              </>
            )}
          </Button>
        </div>

        {/* 결과 영역 */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* 게시글 요약 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    게시글 요약
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{result.postSummary}</p>
                </CardContent>
              </Card>

              {/* 추천 댓글 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">추천 댓글</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.comments.map((comment, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getTypeColor(comment.type)}>
                          {comment.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(idx, comment.content)}
                        >
                          {copied === idx ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                      <p className="text-sm text-gray-500 italic">{comment.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 팁 */}
              {result.tips && result.tips.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      커뮤니티 팁
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-yellow-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>커뮤니티를 선택하고 게시글을 입력한 후</p>
                <p>"댓글 추천받기" 버튼을 클릭하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
