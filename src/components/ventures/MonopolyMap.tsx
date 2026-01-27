'use client'

import { useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PersonalMonopoly, MonopolySkill, MonopolySkillCategory } from '@/types'

interface MonopolyMapProps {
  monopoly: PersonalMonopoly | null
  onSave: (monopoly: PersonalMonopoly) => void
}

const categoryLabels: Record<MonopolySkillCategory, string> = {
  domain: '도메인 전문성',
  technical: '기술 역량',
  creative: '창작/디자인',
  social: '커뮤니티/네트워크',
  business: '비즈니스/마케팅',
}

const defaultSkills: MonopolySkill[] = Object.keys(categoryLabels).map((cat, i) => ({
  id: `skill_${i}`,
  category: cat as MonopolySkillCategory,
  name: categoryLabels[cat as MonopolySkillCategory],
  level: 5,
  isUnique: false,
}))

export function MonopolyMap({ monopoly, onSave }: MonopolyMapProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [skills, setSkills] = useState<MonopolySkill[]>(monopoly?.skills || defaultSkills)
  const [uniqueCombination, setUniqueCombination] = useState(monopoly?.uniqueCombination || '')
  const [targetNiche, setTargetNiche] = useState(monopoly?.targetNiche || '')
  const [gapAnalysis, setGapAnalysis] = useState<string[]>(monopoly?.gapAnalysis || [])
  const [newGap, setNewGap] = useState('')

  // Prepare data for radar chart
  const chartData = skills.map((skill) => ({
    category: categoryLabels[skill.category],
    value: skill.level,
    fullMark: 10,
  }))

  const handleSkillChange = (category: MonopolySkillCategory, level: number) => {
    setSkills((prev) =>
      prev.map((s) => (s.category === category ? { ...s, level } : s))
    )
  }

  const handleAddGap = () => {
    if (newGap.trim()) {
      setGapAnalysis([...gapAnalysis, newGap.trim()])
      setNewGap('')
    }
  }

  const handleRemoveGap = (index: number) => {
    setGapAnalysis(gapAnalysis.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave({
      skills,
      uniqueCombination,
      targetNiche,
      gapAnalysis,
      updatedAt: new Date().toISOString(),
    })
    setIsEditing(false)
  }

  // Calculate average score
  const avgScore = Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>Personal Monopoly Map</span>
            <span className="text-sm font-normal text-gray-500">
              나만의 대체 불가능한 영역
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '취소' : '수정'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Radar Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Radar
                name="스킬 레벨"
                dataKey="value"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Score */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">{avgScore}/10</div>
          <div className="text-sm text-gray-600">평균 역량 점수</div>
        </div>

        {/* Editing Mode */}
        {isEditing ? (
          <div className="space-y-6">
            {/* Skill Sliders */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">역량 레벨 조정</h4>
              {skills.map((skill) => (
                <div key={skill.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{categoryLabels[skill.category]}</span>
                    <span className="font-medium">{skill.level}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={skill.level}
                    onChange={(e) =>
                      handleSkillChange(skill.category, parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Unique Combination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                나만의 조합 (Unique Combination)
              </label>
              <textarea
                value={uniqueCombination}
                onChange={(e) => setUniqueCombination(e.target.value)}
                placeholder="어떤 스킬 조합이 나를 대체 불가능하게 만드나요?"
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* Target Niche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타겟 니치
              </label>
              <input
                type="text"
                value={targetNiche}
                onChange={(e) => setTargetNiche(e.target.value)}
                placeholder="어떤 시장/고객을 공략하나요?"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Gap Analysis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                개발할 스킬 (Gap Analysis)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newGap}
                  onChange={(e) => setNewGap(e.target.value)}
                  placeholder="부족한 스킬 추가"
                  className="flex-1 p-2 border rounded-lg text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGap())}
                />
                <Button type="button" size="sm" onClick={handleAddGap}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.map((gap, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm flex items-center gap-1"
                  >
                    {gap}
                    <button
                      onClick={() => handleRemoveGap(i)}
                      className="hover:text-orange-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full">
              저장
            </Button>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {uniqueCombination && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">나만의 조합</h4>
                <p className="text-gray-800">{uniqueCombination}</p>
              </div>
            )}

            {targetNiche && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">타겟 니치</h4>
                <p className="text-purple-600">{targetNiche}</p>
              </div>
            )}

            {gapAnalysis.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">개발할 스킬</h4>
                <div className="flex flex-wrap gap-2">
                  {gapAnalysis.map((gap, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!uniqueCombination && !targetNiche && gapAnalysis.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="mb-2">Personal Monopoly를 정의해보세요</p>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  시작하기
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
