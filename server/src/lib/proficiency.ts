import { MAX_PROFICIENCY } from '../types/word.js'

export function isMasteredWord(proficiency: number): boolean {
  return proficiency >= MAX_PROFICIENCY
}

export function applyReviewResult(current: number, correct: boolean): number {
  if (correct) {
    return Math.min(MAX_PROFICIENCY, current + 1)
  }
  return Math.max(0, current - 1)
}

export function countMasteredWords(words: { proficiency: number }[]): number {
  return words.filter((w) => isMasteredWord(w.proficiency)).length
}

function isToday(timestamp: number): boolean {
  const date = new Date(timestamp)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export function countTodayStudiedWords(words: { lastReviewedAt?: number }[]): number {
  return words.filter((w) => w.lastReviewedAt != null && isToday(w.lastReviewedAt)).length
}
