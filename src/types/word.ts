export type Language = 'zh' | 'en' | 'ja' | 'es'

export type SortField = 'alpha' | 'date' | 'proficiency'
export type SortOrder = 'asc' | 'desc'

export type StudyMode =
  | 'choice-to-meaning'
  | 'choice-to-word'
  | 'syllable-fill'
  | 'full-dictation'

export interface WordTranslations {
  zh?: string
  en?: string
  ja?: string
  es?: string
}

export interface Word {
  id: string
  /** 词条主语言形式（如西语 Buenos días） */
  word: string
  language: Language
  translations: WordTranslations
  pronunciation?: string
  example?: string
  exampleTranslation?: string
  keySyllables?: string
  proficiency: number
  createdAt: number
  lastReviewedAt?: number
  reviewCount: number
}

export interface ImportResult {
  words: Omit<Word, 'id' | 'createdAt' | 'reviewCount' | 'lastReviewedAt'>[]
  errors: string[]
  /** 本次解析中去除的重复项（同一批内容内） */
  duplicatesSkipped: number
}

export const PRIMARY_LANGUAGE: Language = 'es'

/** 释义语言（主语言固定为西语，不含 es） */
export const MEANING_LANGUAGES: Language[] = ['zh', 'en', 'ja']

export const ALL_LANGUAGES: Language[] = ['zh', 'en', 'ja', 'es']

export const PROFICIENCY_LABELS = [
  '陌生',
  '初识',
  '熟悉',
  '掌握',
  '熟练',
  '精通',
] as const

export const LANGUAGE_LABELS: Record<Language, string> = {
  zh: '中文',
  en: '英语',
  ja: '日语',
  es: '西班牙语',
}

export const LANGUAGE_SHORT: Record<Language, string> = {
  zh: '中',
  en: '英',
  ja: '日',
  es: '西',
}

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  'choice-to-meaning': '选释义',
  'choice-to-word': '选单词',
  'syllable-fill': '填空',
  'full-dictation': '默写',
}
