'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Copy, Check, Sparkles, ArrowLeft, ArrowRight, Save, History, FileText, FolderOpen, Trash2, X } from 'lucide-react'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import { useAuth } from '@/hooks/useAuth'
import {
  savePostingHistory,
  getPostingHistoryList,
  saveComposeTemplate,
  getComposeTemplates,
  deleteComposeTemplate,
  incrementTemplateUsage
} from '@/lib/firebase/firestore'
import Link from 'next/link'
import type { Platform, PlatformContent, PostingHistory, ComposeTemplate } from '@/types'

interface TransformResult {
  transformed_content: string
  hashtags: string[]
  tips: string[]
  character_count: number
}

interface BilingualTransformResult {
  ko: TransformResult
  en: TransformResult
}

const SUPPORTED_PLATFORMS: Platform[] = ['x', 'threads', 'linkedin', 'medium', 'instagram', 'reddit']

type Step = 'idea' | 'draft' | 'transform'

export default function ComposePage() {
  const { user } = useAuth()

  // Step 관리
  const [step, setStep] = useState<Step>('idea')

  // Step 1: 아이디어
  const [topic, setTopic] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [bilingual, setBilingual] = useState(false)

  // Step 2: 초안 (단일 언어 또는 이중 언어)
  const [draft, setDraft] = useState('')
  const [draftKo, setDraftKo] = useState('')
  const [draftEn, setDraftEn] = useState('')

  // Step 3: 변환 (기존 + 이중 언어)
  const [originalContent, setOriginalContent] = useState('')
  const [results, setResults] = useState<Record<string, TransformResult>>({})
  const [bilingualResults, setBilingualResults] = useState<Record<string, BilingualTransformResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)

  // 히스토리/템플릿 모달
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [historyList, setHistoryList] = useState<PostingHistory[]>([])
  const [templates, setTemplates] = useState<ComposeTemplate[]>([])
  const [templateName, setTemplateName] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  // 관심사 로드
  const [interests, setInterests] = useState<string[]>([])
  useEffect(() => {
    const saved = localStorage.getItem('likethis_interests')
    if (saved) {
      setInterests(JSON.parse(saved))
    }
  }, [])

  // 히스토리 불러오기
  const loadHistory = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    try {
      const list = await getPostingHistoryList(user.uid, 20)
      setHistoryList(list)
    } catch (error) {
      console.error('Load history error:', error)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  // 템플릿 불러오기
  const loadTemplates = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    try {
      const list = await getComposeTemplates(user.uid, 20)
      setTemplates(list)
    } catch (error) {
      console.error('Load templates error:', error)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  // 히스토리에서 불러오기
  const handleLoadFromHistory = (history: PostingHistory) => {
    setTopic(history.topic)
    setKeyPoints(history.keyPoints)
    setDraft(history.originalDraft)
    setOriginalContent(history.originalDraft)
    setShowHistoryModal(false)
    setStep('draft')
  }

  // 템플릿에서 불러오기
  const handleLoadFromTemplate = async (template: ComposeTemplate) => {
    if (!user) return
    setTopic(template.topic)
    setKeyPoints(template.keyPoints)
    setBilingual(template.bilingual)
    setShowTemplateModal(false)
    await incrementTemplateUsage(user.uid, template.id)
  }

  // 템플릿 저장
  const handleSaveTemplate = async () => {
    if (!user || !templateName.trim() || !topic.trim()) {
      alert('템플릿 이름과 주제를 입력해주세요.')
      return
    }
    try {
      await saveComposeTemplate(user.uid, templateName.trim(), topic, keyPoints, bilingual)
      setShowSaveTemplateModal(false)
      setTemplateName('')
      alert('템플릿이 저장되었습니다.')
    } catch (error) {
      console.error('Save template error:', error)
      alert('템플릿 저장에 실패했습니다.')
    }
  }

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId: string) => {
    if (!user) return
    if (!confirm('템플릿을 삭제하시겠습니까?')) return
    try {
      await deleteComposeTemplate(user.uid, templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Delete template error:', error)
    }
  }

  // 자동 저장 함수
  const autoSaveToHistory = useCallback(async (
    platformResults: Record<string, TransformResult>,
    bilingualPlatformResults: Record<string, BilingualTransformResult>
  ) => {
    if (!user) return

    const hasResults = Object.keys(platformResults).length > 0 || Object.keys(bilingualPlatformResults).length > 0
    if (!hasResults) return

    try {
      const platformContents: PlatformContent[] = []

      for (const [platform, result] of Object.entries(platformResults)) {
        platformContents.push({
          platform: platform as Platform,
          content: result.transformed_content,
          hashtags: result.hashtags || [],
        })
      }

      for (const [platform, result] of Object.entries(bilingualPlatformResults)) {
        platformContents.push({
          platform: platform as Platform,
          content: `[KO]\n${result.ko.transformed_content}\n\n[EN]\n${result.en.transformed_content}`,
          hashtags: [...(result.ko.hashtags || []), ...(result.en.hashtags || [])],
        })
      }

      const originalDraftContent = bilingual ? draftKo || draftEn : draft || originalContent

      await savePostingHistory(
        user.uid,
        topic,
        keyPoints,
        originalDraftContent,
        platformContents
      )

      setAutoSaved(true)
      setTimeout(() => setAutoSaved(false), 3000)
    } catch (error) {
      console.error('Auto save error:', error)
    }
  }, [user, topic, keyPoints, bilingual, draftKo, draftEn, draft, originalContent])

  // AI 초안 생성
  const handleGenerateDraft = async () => {
    if (!topic.trim() || !keyPoints.trim()) return

    setDraftLoading(true)
    try {
      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keyPoints,
          interests,
          bilingual,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate draft')

      const data = await response.json()

      if (bilingual && typeof data.draft === 'object') {
        setDraftKo(data.draft.ko || '')
        setDraftEn(data.draft.en || '')
        setDraft('') // 단일 언어 초안 초기화
      } else {
        setDraft(data.draft)
        setDraftKo('')
        setDraftEn('')
      }
      setStep('draft')
    } catch (error) {
      console.error('Generate draft error:', error)
      alert('초안 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDraftLoading(false)
    }
  }

  // 초안을 변환 단계로 전달
  const handleUseDraft = () => {
    if (bilingual) {
      // 이중 언어 모드에서는 한국어 초안을 기본으로 사용
      setOriginalContent(draftKo || draftEn)
    } else {
      setOriginalContent(draft)
    }
    setStep('transform')
  }

  // 직접 작성 모드로 전환
  const handleSkipDraft = () => {
    setStep('transform')
  }

  const handleTransform = async (platform: string) => {
    const contentToTransform = bilingual ? (draftKo || originalContent) : originalContent
    if (!contentToTransform.trim()) return

    setLoading(prev => ({ ...prev, [platform]: true }))

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToTransform,
          targetPlatform: platform,
          bilingual,
        }),
      })

      if (!response.ok) throw new Error('Transform failed')

      const data = await response.json()

      if (bilingual && data.ko && data.en) {
        setBilingualResults(prev => ({ ...prev, [platform]: data }))
      } else {
        setResults(prev => ({ ...prev, [platform]: data }))
      }
    } catch (error) {
      console.error('Transform error:', error)
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleTransformAll = async () => {
    const newResults: Record<string, TransformResult> = {}
    const newBilingualResults: Record<string, BilingualTransformResult> = {}

    for (const platform of SUPPORTED_PLATFORMS) {
      const contentToTransform = bilingual ? (draftKo || originalContent) : originalContent
      if (!contentToTransform.trim()) continue

      setLoading(prev => ({ ...prev, [platform]: true }))

      try {
        const response = await fetch('/api/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: contentToTransform,
            targetPlatform: platform,
            bilingual,
          }),
        })

        if (!response.ok) throw new Error('Transform failed')

        const data = await response.json()

        if (bilingual && data.ko && data.en) {
          newBilingualResults[platform] = data
          setBilingualResults(prev => ({ ...prev, [platform]: data }))
        } else {
          newResults[platform] = data
          setResults(prev => ({ ...prev, [platform]: data }))
        }
      } catch (error) {
        console.error('Transform error:', error)
      } finally {
        setLoading(prev => ({ ...prev, [platform]: false }))
      }
    }

    // 자동 저장
    await autoSaveToHistory(
      { ...results, ...newResults },
      { ...bilingualResults, ...newBilingualResults }
    )
  }

  const handleCopy = async (platform: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(platform)
    setTimeout(() => setCopied(null), 2000)
  }

  // 히스토리에 저장
  const handleSaveToHistory = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    const hasResults = Object.keys(results).length > 0 || Object.keys(bilingualResults).length > 0
    if (!hasResults) {
      alert('저장할 변환 결과가 없습니다. 먼저 플랫폼 변환을 진행해주세요.')
      return
    }

    setSaving(true)
    try {
      // 플랫폼 컨텐츠 수집
      const platformContents: PlatformContent[] = []

      // 단일 언어 결과
      for (const [platform, result] of Object.entries(results)) {
        platformContents.push({
          platform: platform as Platform,
          content: result.transformed_content,
          hashtags: result.hashtags || [],
        })
      }

      // 이중 언어 결과 (한국어만 저장, 영어는 별도로)
      for (const [platform, result] of Object.entries(bilingualResults)) {
        platformContents.push({
          platform: platform as Platform,
          content: `[KO]\n${result.ko.transformed_content}\n\n[EN]\n${result.en.transformed_content}`,
          hashtags: [...(result.ko.hashtags || []), ...(result.en.hashtags || [])],
        })
      }

      const originalDraftContent = bilingual ? draftKo || draftEn : draft || originalContent

      await savePostingHistory(
        user.uid,
        topic,
        keyPoints,
        originalDraftContent,
        platformContents
      )

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Save error:', error)
      alert('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">크로스포스팅</h1>
          <p className="text-gray-600 mt-2">
            아이디어에서 시작해 모든 플랫폼에 맞게 변환하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadTemplates()
              setShowTemplateModal(true)
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            템플릿
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadHistory()
              setShowHistoryModal(true)
            }}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            불러오기
          </Button>
          <Link href="/dashboard/compose/history">
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-2" />
              히스토리
            </Button>
          </Link>
        </div>
      </div>

      {/* 자동 저장 알림 */}
      {autoSaved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Check className="w-4 h-4" />
          자동 저장됨
        </div>
      )}

      {/* 단계 표시 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStep('idea')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            step === 'idea' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          1. 아이디어
        </button>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => draft && setStep('draft')}
          disabled={!draft}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            step === 'draft' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } ${!draft ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          2. 초안
        </button>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setStep('transform')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            step === 'transform' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          3. 변환
        </button>
      </div>

      {/* Step 1: 아이디어 입력 */}
      {step === 'idea' && (
        <Card>
          <CardHeader>
            <CardTitle>무슨 글을 쓸까요?</CardTitle>
            <CardDescription>주제와 핵심 내용을 입력하면 AI가 초안을 작성해드립니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">주제</label>
              <Input
                placeholder="예: 1인개발 1주년 회고"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">핵심 내용</label>
              <Textarea
                placeholder="bullet point로 적어보세요&#10;- 1년간 만든 프로젝트들&#10;- 가장 힘들었던 순간&#10;- 배운 점과 앞으로의 계획"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bilingual"
                checked={bilingual}
                onCheckedChange={(checked) => setBilingual(checked === true)}
              />
              <label
                htmlFor="bilingual"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                한/영 동시 생성
              </label>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleGenerateDraft}
                disabled={!topic.trim() || !keyPoints.trim() || draftLoading}
              >
                {draftLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 초안 생성
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleSkipDraft}>
                직접 작성하기
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSaveTemplateModal(true)}
                disabled={!topic.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                템플릿으로 저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 초안 검토 */}
      {step === 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>AI 초안</CardTitle>
            <CardDescription>초안을 수정하고 마음에 들면 변환 단계로 진행하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bilingual && draftKo && draftEn ? (
              <Tabs defaultValue="ko">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ko">한국어</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                <TabsContent value="ko">
                  <Textarea
                    value={draftKo}
                    onChange={(e) => setDraftKo(e.target.value)}
                    rows={10}
                    className="text-base"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                    <span>{draftKo.length}자</span>
                  </div>
                </TabsContent>
                <TabsContent value="en">
                  <Textarea
                    value={draftEn}
                    onChange={(e) => setDraftEn(e.target.value)}
                    rows={10}
                    className="text-base"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                    <span>{draftEn.length} characters</span>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={10}
                  className="text-base"
                />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{draft.length}자</span>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('idea')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                다시 작성
              </Button>
              <Button onClick={handleUseDraft} disabled={bilingual ? !draftKo && !draftEn : !draft}>
                이대로 변환하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 플랫폼 변환 (기존) */}
      {step === 'transform' && (
        <>
          {/* 원본 콘텐츠 입력 */}
          <Card>
            <CardHeader>
              <CardTitle>원본 콘텐츠</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="공유하고 싶은 내용을 자유롭게 작성하세요..."
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleTransformAll}
                  disabled={!originalContent.trim() && !draftKo}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  전체 플랫폼 변환
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveToHistory}
                  disabled={saving || (Object.keys(results).length === 0 && Object.keys(bilingualResults).length === 0)}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : saved ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saved ? '저장됨' : '히스토리에 저장'}
                </Button>
                <span className="text-sm text-gray-500 self-center">
                  {originalContent.length}자
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 플랫폼별 결과 */}
          <Tabs defaultValue="x">
            <TabsList className="grid grid-cols-6 w-full">
              {SUPPORTED_PLATFORMS.map((platform) => {
                const guide = PLATFORM_GUIDES[platform]
                return (
                  <TabsTrigger key={platform} value={platform}>
                    {guide?.icon} {guide?.name?.split(' ')[0]}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {SUPPORTED_PLATFORMS.map((platform) => {
              const guide = PLATFORM_GUIDES[platform]
              const result = results[platform]
              const bilingualResult = bilingualResults[platform]
              const isLoading = loading[platform]
              const hasContent = bilingual ? (draftKo || originalContent) : originalContent

              return (
                <TabsContent key={platform} value={platform}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {guide?.icon} {guide?.name}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransform(platform)}
                        disabled={!hasContent?.trim() || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '변환'
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {bilingual && bilingualResult ? (
                        <Tabs defaultValue="ko">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ko">한국어</TabsTrigger>
                            <TabsTrigger value="en">English</TabsTrigger>
                          </TabsList>
                          <TabsContent value="ko" className="space-y-4">
                            <div className="relative">
                              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                                {bilingualResult.ko.transformed_content}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => handleCopy(`${platform}-ko`, bilingualResult.ko.transformed_content)}
                              >
                                {copied === `${platform}-ko` ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{bilingualResult.ko.character_count}자</span>
                              {bilingualResult.ko.hashtags?.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {bilingualResult.ko.hashtags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {bilingualResult.ko.tips?.length > 0 && (
                              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                                {bilingualResult.ko.tips[0]}
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="en" className="space-y-4">
                            <div className="relative">
                              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                                {bilingualResult.en.transformed_content}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => handleCopy(`${platform}-en`, bilingualResult.en.transformed_content)}
                              >
                                {copied === `${platform}-en` ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{bilingualResult.en.character_count} chars</span>
                              {bilingualResult.en.hashtags?.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {bilingualResult.en.hashtags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {bilingualResult.en.tips?.length > 0 && (
                              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                                {bilingualResult.en.tips[0]}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      ) : result ? (
                        <>
                          <div className="relative">
                            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                              {result.transformed_content}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => handleCopy(platform, result.transformed_content)}
                            >
                              {copied === platform ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{result.character_count}자</span>
                            {result.hashtags?.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {result.hashtags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {result.tips?.length > 0 && (
                            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                              {result.tips[0]}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          원본 콘텐츠를 입력하고 변환 버튼을 클릭하세요
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </>
      )}

      {/* 히스토리 불러오기 모달 */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>히스토리에서 불러오기</DialogTitle>
            <DialogDescription>이전에 작성한 내용을 불러와 수정할 수 있습니다</DialogDescription>
          </DialogHeader>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              저장된 히스토리가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {historyList.map((history) => (
                <div
                  key={history.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleLoadFromHistory(history)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{history.topic || '(제목 없음)'}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(history.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {history.keyPoints || history.originalDraft?.substring(0, 100)}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {history.platformContents?.map((pc) => (
                      <Badge key={pc.platform} variant="secondary" className="text-xs">
                        {pc.platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 템플릿 불러오기 모달 */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>템플릿 불러오기</DialogTitle>
            <DialogDescription>저장된 템플릿을 불러와 빠르게 시작하세요</DialogDescription>
          </DialogHeader>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              저장된 템플릿이 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleLoadFromTemplate(template)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.bilingual && (
                        <Badge variant="outline" className="text-xs">한/영</Badge>
                      )}
                      {template.usedCount > 0 && (
                        <span className="text-xs text-gray-400">
                          {template.usedCount}회 사용
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{template.topic}</p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {template.keyPoints}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 템플릿 저장 모달 */}
      <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>템플릿으로 저장</DialogTitle>
            <DialogDescription>자주 사용하는 주제와 핵심 내용을 템플릿으로 저장하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">템플릿 이름</label>
              <Input
                placeholder="예: 주간 회고, 신기능 발표"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium">{topic || '(주제 없음)'}</p>
              <p className="text-gray-600 mt-1 line-clamp-3">{keyPoints || '(핵심 내용 없음)'}</p>
              {bilingual && <Badge variant="outline" className="mt-2">한/영 동시 생성</Badge>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>
              취소
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim() || !topic.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
