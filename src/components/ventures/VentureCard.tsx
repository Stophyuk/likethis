'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Venture, VentureStatus } from '@/types'

interface VentureCardProps {
  venture: Venture
  onEdit?: (venture: Venture) => void
  onStatusChange?: (venture: Venture, status: VentureStatus) => void
  onArchive?: (venture: Venture) => void
}

const statusConfig: Record<VentureStatus, { label: string; color: string; nextStatus?: VentureStatus }> = {
  idea: { label: '아이디어', color: 'bg-gray-100 text-gray-700', nextStatus: 'building' },
  building: { label: '빌딩 중', color: 'bg-blue-100 text-blue-700', nextStatus: 'launched' },
  launched: { label: '런칭됨', color: 'bg-green-100 text-green-700', nextStatus: 'growing' },
  growing: { label: '성장 중', color: 'bg-purple-100 text-purple-700' },
  paused: { label: '일시정지', color: 'bg-yellow-100 text-yellow-700', nextStatus: 'building' },
  archived: { label: '보관됨', color: 'bg-gray-100 text-gray-500' },
}

export function VentureCard({ venture, onEdit, onStatusChange, onArchive }: VentureCardProps) {
  const status = statusConfig[venture.status]

  const handleNextStatus = () => {
    if (status.nextStatus && onStatusChange) {
      onStatusChange(venture, status.nextStatus)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{venture.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {venture.description}
            </p>

            {/* Monopoly Contribution */}
            {venture.monopolyContribution && (
              <div className="mb-3">
                <span className="text-xs text-gray-500">Monopoly 기여:</span>
                <p className="text-sm text-purple-600">{venture.monopolyContribution}</p>
              </div>
            )}

            {/* Tags */}
            {venture.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {venture.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Revenue */}
            {venture.revenue !== undefined && venture.revenue > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">월 수익:</span>
                <span className="ml-1 font-medium text-green-600">
                  ₩{venture.revenue.toLocaleString()}
                </span>
              </div>
            )}

            {/* Dates */}
            <div className="flex gap-4 text-xs text-gray-400 mt-3">
              <span>시작: {new Date(venture.startedAt).toLocaleDateString('ko-KR')}</span>
              {venture.launchedAt && (
                <span>런칭: {new Date(venture.launchedAt).toLocaleDateString('ko-KR')}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {venture.url && (
              <a
                href={venture.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                방문 →
              </a>
            )}
            {status.nextStatus && (
              <Button size="sm" variant="outline" onClick={handleNextStatus}>
                {statusConfig[status.nextStatus].label}로
              </Button>
            )}
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(venture)}
                  className="text-xs"
                >
                  수정
                </Button>
              )}
              {onArchive && venture.status !== 'archived' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArchive(venture)}
                  className="text-xs text-gray-400"
                >
                  보관
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
