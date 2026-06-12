import { MAX_PROFICIENCY, PROFICIENCY_LABELS, type Word } from '../types/word'

export { MAX_PROFICIENCY }

export function isMasteredWord(proficiency: number): boolean {
  return proficiency >= MAX_PROFICIENCY
}

export function getProficiencyLabel(proficiency: number): string {
  const clamped = Math.max(0, Math.min(MAX_PROFICIENCY, proficiency))
  return PROFICIENCY_LABELS[clamped]
}

export function applyReviewResult(current: number, correct: boolean): number {
  if (correct) {
    return Math.min(MAX_PROFICIENCY, current + 1)
  }
  return Math.max(0, current - 1)
}

export function getProficiencyProgress(proficiency: number): number {
  return Math.round((Math.max(0, Math.min(MAX_PROFICIENCY, proficiency)) / MAX_PROFICIENCY) * 100)
}

export function getProficiencyBadgeClass(proficiency: number): string {
  if (isMasteredWord(proficiency)) {
    return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
  }
  const colors = [
    'bg-slate-100 text-slate-600',
    'bg-amber-50 text-amber-700',
    'bg-yellow-50 text-yellow-700',
    'bg-emerald-50 text-emerald-700',
    'bg-teal-50 text-teal-700',
    'bg-amber-100 text-amber-800',
  ]
  return colors[Math.max(0, Math.min(MAX_PROFICIENCY, proficiency))]
}

export function getReviewFeedback(
  previous: number,
  next: number,
  correct: boolean,
): string | null {
  if (next > previous) {
    if (isMasteredWord(next)) return '熟练度已满，已成为熟词 ★'
    return `熟练度 +1 → ${getProficiencyLabel(next)}`
  }
  if (next < previous) {
    return `熟练度 -1 → ${getProficiencyLabel(next)}`
  }
  if (!correct && next === previous && previous === 0) {
    return '已是最低熟练度，不再扣除'
  }
  if (correct && isMasteredWord(next)) {
    return '熟词复习正确，保持熟练 ★'
  }
  return null
}

export function countMasteredWords(words: Pick<Word, 'proficiency'>[]): number {
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

/** 今日已背过的单词数（按词条去重，同一词多次复习只计一次） */
export function countTodayStudiedWords(words: Pick<Word, 'lastReviewedAt'>[]): number {
  return words.filter((w) => w.lastReviewedAt != null && isToday(w.lastReviewedAt)).length
}
