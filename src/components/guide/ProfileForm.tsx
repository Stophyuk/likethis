'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, X } from 'lucide-react'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import type { UserProfileInfo, Platform } from '@/types'

const SUPPORTED_PLATFORMS: Platform[] = ['x', 'linkedin', 'instagram', 'medium', 'reddit', 'youtube', 'naver']

interface ProfileFormProps {
  onSubmit: (userInfo: UserProfileInfo, platforms: Platform[]) => Promise<void>
  loading: boolean
}

export function ProfileForm({ onSubmit, loading }: ProfileFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [expertiseInput, setExpertiseInput] = useState('')
  const [expertise, setExpertise] = useState<string[]>([])
  const [targetAudience, setTargetAudience] = useState('')
  const [goals, setGoals] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['x', 'linkedin'])

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()])
      setExpertiseInput('')
    }
  }

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter(e => e !== item))
  }

  const handlePlatformToggle = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !role.trim() || expertise.length === 0 || selectedPlatforms.length === 0) {
      alert('필수 정보를 모두 입력해주세요.')
      return
    }

    const userInfo: UserProfileInfo = {
      name: name.trim(),
      role: role.trim(),
      expertise,
      targetAudience: targetAudience.trim() || '일반 사용자',
      goals: goals.trim() || '브랜드 인지도 향상',
    }

    await onSubmit(userInfo, selectedPlatforms)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로필 정보 입력</CardTitle>
        <CardDescription>
          AI가 각 플랫폼에 최적화된 프로필 문구를 생성합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                이름 / 닉네임 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                역할 / 직업 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="1인 개발자, PM, 디자이너 등"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 전문분야 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              전문분야 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="전문분야 입력 후 추가"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
              />
              <Button type="button" variant="outline" onClick={handleAddExpertise}>
                추가
              </Button>
            </div>
            {expertise.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {expertise.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(item)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 목표 청중 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              목표 청중
            </label>
            <Input
              placeholder="예: 스타트업 창업자, 주니어 개발자, 사이드프로젝트에 관심있는 사람들"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          {/* 목표 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              달성하고 싶은 목표
            </label>
            <Textarea
              placeholder="예: 사이드프로젝트 경험 공유, 네트워킹, 커뮤니티 빌딩"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
            />
          </div>

          {/* 플랫폼 선택 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              프로필을 생성할 플랫폼 <span className="text-red-500">*</span>
            </label>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {SUPPORTED_PLATFORMS.map((platform) => {
                const guide = PLATFORM_GUIDES[platform]
                const isSelected = selectedPlatforms.includes(platform)

                return (
                  <div
                    key={platform}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePlatformToggle(platform)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                    />
                    <span className="text-lg">{guide?.icon}</span>
                    <span className="text-sm font-medium">{guide?.name?.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !name.trim() || !role.trim() || expertise.length === 0 || selectedPlatforms.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                프로필 문구 생성
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
