import type { StudyMode } from '../types/word'

const STORAGE_KEY = 'weavord-study-session'

export interface StudySessionSnapshot {
  mode: StudyMode
  batchIds: string[]
  index: number
  score: { correct: number; total: number }
  awaitingContinue: boolean
  selectedAnswer?: string
  reviewProficiency?: { previous: number; next: number } | null
}

export function saveStudySession(snapshot: StudySessionSnapshot): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore quota / private mode errors
  }
}

export function loadStudySession(): StudySessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StudySessionSnapshot
  } catch {
    return null
  }
}

export function clearStudySession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
