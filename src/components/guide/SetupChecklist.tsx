'use client'

import { useState, useEffect } from 'react'
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

export function SetupChecklist({ platform, items }: SetupChecklistProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const storageKey = `likethis_setup_${platform}`

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setCompleted(new Set(JSON.parse(saved)))
    }
  }, [storageKey])

  const toggleItem = (id: string) => {
    const newCompleted = new Set(completed)
    if (newCompleted.has(id)) {
      newCompleted.delete(id)
    } else {
      newCompleted.add(id)
    }
    setCompleted(newCompleted)
    localStorage.setItem(storageKey, JSON.stringify([...newCompleted]))
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
