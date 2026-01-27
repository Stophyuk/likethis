'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TranslatorGlossaryProps {
  translations: Record<string, string>
  highlightedTerms?: string[]
}

export function TranslatorGlossary({
  translations,
  highlightedTerms = [],
}: TranslatorGlossaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const entries = Object.entries(translations)
  const filteredEntries = searchQuery
    ? entries.filter(
        ([term, translation]) =>
          term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          translation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries

  const displayEntries = isExpanded ? filteredEntries : filteredEntries.slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>번역 사전</span>
            <span className="text-sm font-normal text-gray-500">
              기술 용어 → 쉬운 말
            </span>
          </span>
          <span className="text-xs text-gray-400">{entries.length}개 용어</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="용어 검색..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />

        {/* Terms List */}
        <div className="space-y-2">
          {displayEntries.map(([term, translation]) => {
            const isHighlighted = highlightedTerms.includes(term)
            return (
              <div
                key={term}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isHighlighted
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-900">
                      {term}
                    </span>
                    {isHighlighted && (
                      <span className="px-1.5 py-0.5 text-xs bg-amber-200 text-amber-800 rounded">
                        사용됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{translation}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Show More/Less */}
        {filteredEntries.length > 6 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded
              ? '접기'
              : `${filteredEntries.length - 6}개 더 보기`}
          </button>
        )}

        {filteredEntries.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            검색 결과가 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  )
}
