'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Link as LinkIcon, Bell, CheckCircle } from 'lucide-react'

interface SummaryResult {
  summary: string
  hot_topics: Array<{ topic: string; links: string[] }>
  announcements: string[]
  action_items: Array<{ type: string; description: string; target?: string }>
  extracted_links: string[]
}

export default function KakaoRoomPage({
  params,
}: {
  params: { roomId: string }
}) {
  const [chatContent, setChatContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState('')

  const handleSummarize = async () => {
    if (!chatContent.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/summarize-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatContent,
          roomName: '카카오톡 방',
        }),
      })

      if (!response.ok) throw new Error('요약 실패')

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('요약 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대화 요약</h1>
        <p className="text-gray-600 mt-2">
          카카오톡 대화를 붙여넣고 AI가 요약해드립니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>대화 내용 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="카카오톡 대화 내용을 여기에 붙여넣으세요..."
            value={chatContent}
            onChange={(e) => setChatContent(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <Button onClick={handleSummarize} disabled={loading || !chatContent.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                요약 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 요약하기
              </>
            )}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* 전체 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>요약</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{result.summary}</p>
            </CardContent>
          </Card>

          {/* 핫 토픽 */}
          {result.hot_topics?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>핫 토픽</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.hot_topics.map((topic, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-medium">{topic.topic}</p>
                      {topic.links?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {topic.links.map((link, linkIdx) => (
                            <a
                              key={linkIdx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 공지사항 */}
          {result.announcements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  공지사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.announcements.map((ann, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      {ann}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 액션 아이템 */}
          {result.action_items?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  참여 추천
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <Badge variant="outline">{item.type}</Badge>
                      <span>{item.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 추출된 링크 */}
          {result.extracted_links?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  추출된 링크
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.extracted_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline text-sm truncate"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
