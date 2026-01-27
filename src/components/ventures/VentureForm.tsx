'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Venture, VentureStatus } from '@/types'

interface VentureFormProps {
  venture?: Venture | null
  onSubmit: (venture: Venture) => void
  onCancel: () => void
}

const statusOptions: { value: VentureStatus; label: string }[] = [
  { value: 'idea', label: '아이디어' },
  { value: 'building', label: '빌딩 중' },
  { value: 'launched', label: '런칭됨' },
  { value: 'growing', label: '성장 중' },
  { value: 'paused', label: '일시정지' },
]

export function VentureForm({ venture, onSubmit, onCancel }: VentureFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<VentureStatus>('idea')
  const [monopolyContribution, setMonopolyContribution] = useState('')
  const [tags, setTags] = useState('')
  const [url, setUrl] = useState('')
  const [revenue, setRevenue] = useState('')

  useEffect(() => {
    if (venture) {
      setName(venture.name)
      setDescription(venture.description)
      setStatus(venture.status)
      setMonopolyContribution(venture.monopolyContribution)
      setTags(venture.tags.join(', '))
      setUrl(venture.url || '')
      setRevenue(venture.revenue?.toString() || '')
    }
  }, [venture])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !description.trim()) return

    const now = new Date().toISOString()
    const newVenture: Venture = {
      id: venture?.id || `venture_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      status,
      monopolyContribution: monopolyContribution.trim(),
      linkedPostingIds: venture?.linkedPostingIds || [],
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      url: url.trim() || undefined,
      revenue: revenue ? parseFloat(revenue) : undefined,
      startedAt: venture?.startedAt || now,
      launchedAt: status === 'launched' && !venture?.launchedAt ? now : venture?.launchedAt,
      createdAt: venture?.createdAt || now,
      updatedAt: now,
    }

    onSubmit(newVenture)
  }

  const isEditing = !!venture

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '벤처 수정' : '새 벤처 추가'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: LikeThis"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 벤처가 무엇인지 설명해주세요"
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VentureStatus)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monopoly Contribution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Monopoly 기여
            </label>
            <input
              type="text"
              value={monopolyContribution}
              onChange={(e) => setMonopolyContribution(e.target.value)}
              placeholder="이 벤처가 나만의 영역에 어떻게 기여하나요?"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="쉼표로 구분 (예: SaaS, AI, 생산성)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월 수익 (원)</label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? '수정 저장' : '벤처 추가'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
