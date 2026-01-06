'use client'

import { useState, useEffect, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface SetupItem {
  id: string
  title: string
  description: string
}

interface SetupChecklistProps {
  platform: string
  items: SetupItem[]
}

function getStorageKey(platform: string): string {
  return `likethis_setup_${platform}`
}

function loadCompleted(platform: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  const saved = localStorage.getItem(getStorageKey(platform))
  if (saved) {
    return new Set(JSON.parse(saved))
  }
  return new Set()
}

function saveCompleted(platform: string, completed: Set<string>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(platform), JSON.stringify([...completed]))
}

export function SetupChecklist({ platform, items }: SetupChecklistProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const updateData = useCallback(() => {
    setCompleted(loadCompleted(platform))
  }, [platform])

  useEffect(() => {
    updateData()
  }, [updateData])

  const toggleItem = (id: string) => {
    const newCompleted = new Set(completed)
    if (newCompleted.has(id)) {
      newCompleted.delete(id)
    } else {
      newCompleted.add(id)
    }
    setCompleted(newCompleted)
    saveCompleted(platform, newCompleted)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        {completed.size}/{items.length} 완료
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <Checkbox
            id={item.id}
            checked={completed.has(item.id)}
            onCheckedChange={() => toggleItem(item.id)}
            className="mt-1"
          />
          <label htmlFor={item.id} className="flex-1 cursor-pointer">
            <p className={`font-medium ${completed.has(item.id) ? 'line-through text-gray-400' : ''}`}>
              {item.title}
            </p>
            <p className="text-sm text-gray-500">{item.description}</p>
          </label>
        </div>
      ))}
    </div>
  )
}
