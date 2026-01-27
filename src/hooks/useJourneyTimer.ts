'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DeepWorkCategory, DeepWorkMode, DeepWorkSession, TimerState } from '@/types'

const STORAGE_KEY = 'likethis_journey_timer_state'
const SESSIONS_KEY_PREFIX = 'likethis_journey_sessions_'

interface UseJourneyTimerOptions {
  onSessionComplete?: (session: DeepWorkSession) => void
}

interface UseJourneyTimerReturn {
  // Timer state
  isRunning: boolean
  isPaused: boolean
  category: DeepWorkCategory
  mode: DeepWorkMode
  elapsedSeconds: number

  // Timer controls
  start: (category: DeepWorkCategory, mode: DeepWorkMode) => void
  pause: () => void
  resume: () => void
  stop: (notes?: string) => DeepWorkSession | null
  reset: () => void

  // Session management
  todaySessions: DeepWorkSession[]
  getTodayStats: () => { pure: number; aiAssisted: number; total: number }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function loadTimerState(): TimerState | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function saveTimerState(state: TimerState | null): void {
  if (typeof window === 'undefined') return
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function loadTodaySessions(): DeepWorkSession[] {
  if (typeof window === 'undefined') return []
  const key = `${SESSIONS_KEY_PREFIX}${getToday()}`
  const stored = localStorage.getItem(key)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveTodaySessions(sessions: DeepWorkSession[]): void {
  if (typeof window === 'undefined') return
  const key = `${SESSIONS_KEY_PREFIX}${getToday()}`
  localStorage.setItem(key, JSON.stringify(sessions))
}

export function useJourneyTimer(options: UseJourneyTimerOptions = {}): UseJourneyTimerReturn {
  const { onSessionComplete } = options

  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [category, setCategory] = useState<DeepWorkCategory>('thinking')
  const [mode, setMode] = useState<DeepWorkMode>('pure')
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [todaySessions, setTodaySessions] = useState<DeepWorkSession[]>([])

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hiddenAtRef = useRef<number | null>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadTimerState()
    if (savedState && savedState.isRunning && savedState.startedAt) {
      setIsRunning(true)
      setIsPaused(false)
      setCategory(savedState.category)
      setMode(savedState.mode)
      setStartedAt(savedState.startedAt)
      setAccumulatedSeconds(savedState.accumulatedSeconds)

      // Calculate elapsed time since start
      const elapsed = Math.floor((Date.now() - new Date(savedState.startedAt).getTime()) / 1000)
      setElapsedSeconds(savedState.accumulatedSeconds + elapsed)
    }

    setTodaySessions(loadTodaySessions())
  }, [])

  // Timer interval
  useEffect(() => {
    if (isRunning && !isPaused && startedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        setElapsedSeconds(accumulatedSeconds + elapsed)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, startedAt, accumulatedSeconds])

  // Save state to localStorage
  useEffect(() => {
    if (isRunning) {
      const state: TimerState = {
        isRunning,
        category,
        mode,
        startedAt,
        accumulatedSeconds: isPaused ? elapsedSeconds : accumulatedSeconds,
      }
      saveTimerState(state)
    }
  }, [isRunning, isPaused, category, mode, startedAt, accumulatedSeconds, elapsedSeconds])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - save current time
        hiddenAtRef.current = Date.now()
      } else {
        // Page visible - recalculate elapsed time
        if (isRunning && !isPaused && startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
          setElapsedSeconds(accumulatedSeconds + elapsed)
        }
        hiddenAtRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, isPaused, startedAt, accumulatedSeconds])

  // Handle beforeunload - save state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning) {
        const state: TimerState = {
          isRunning,
          category,
          mode,
          startedAt,
          accumulatedSeconds: isPaused ? elapsedSeconds : accumulatedSeconds,
        }
        saveTimerState(state)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isRunning, isPaused, category, mode, startedAt, accumulatedSeconds, elapsedSeconds])

  const start = useCallback((newCategory: DeepWorkCategory, newMode: DeepWorkMode) => {
    const now = new Date().toISOString()
    setCategory(newCategory)
    setMode(newMode)
    setStartedAt(now)
    setAccumulatedSeconds(0)
    setElapsedSeconds(0)
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setAccumulatedSeconds(elapsedSeconds)
      setIsPaused(true)
    }
  }, [isRunning, isPaused, elapsedSeconds])

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setStartedAt(new Date().toISOString())
      setIsPaused(false)
    }
  }, [isRunning, isPaused])

  const stop = useCallback((notes?: string): DeepWorkSession | null => {
    if (!isRunning) return null

    const session: DeepWorkSession = {
      id: `session_${Date.now()}`,
      category,
      mode,
      startedAt: startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      duration: elapsedSeconds,
      notes,
    }

    // Save to localStorage
    const updatedSessions = [session, ...todaySessions]
    setTodaySessions(updatedSessions)
    saveTodaySessions(updatedSessions)

    // Reset timer state
    setIsRunning(false)
    setIsPaused(false)
    setStartedAt(null)
    setAccumulatedSeconds(0)
    setElapsedSeconds(0)
    saveTimerState(null)

    // Callback
    onSessionComplete?.(session)

    return session
  }, [isRunning, category, mode, startedAt, elapsedSeconds, todaySessions, onSessionComplete])

  const reset = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setStartedAt(null)
    setAccumulatedSeconds(0)
    setElapsedSeconds(0)
    saveTimerState(null)
  }, [])

  const getTodayStats = useCallback(() => {
    let pure = 0
    let aiAssisted = 0

    for (const session of todaySessions) {
      const minutes = Math.round((session.duration || 0) / 60)
      if (session.mode === 'pure') {
        pure += minutes
      } else {
        aiAssisted += minutes
      }
    }

    return { pure, aiAssisted, total: pure + aiAssisted }
  }, [todaySessions])

  return {
    isRunning,
    isPaused,
    category,
    mode,
    elapsedSeconds,
    start,
    pause,
    resume,
    stop,
    reset,
    todaySessions,
    getTodayStats,
  }
}
