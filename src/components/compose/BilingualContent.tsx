'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface BilingualContentProps {
  korean: string
  english: string
  className?: string
}

export function BilingualContent({ korean, english, className }: BilingualContentProps) {
  const [copied, setCopied] = useState<'ko' | 'en' | null>(null)

  const handleCopy = async (lang: 'ko' | 'en', content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(lang)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Tabs defaultValue="ko" className={className}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ko">한국어</TabsTrigger>
        <TabsTrigger value="en">English</TabsTrigger>
      </TabsList>
      <TabsContent value="ko">
        <div className="relative">
          <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap min-h-[100px]">
            {korean}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => handleCopy('ko', korean)}
          >
            {copied === 'ko' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="en">
        <div className="relative">
          <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap min-h-[100px]">
            {english}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => handleCopy('en', english)}
          >
            {copied === 'en' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
