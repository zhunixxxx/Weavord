export type Language = 'zh' | 'en' | 'ja' | 'es'

export type SortField = 'alpha' | 'date' | 'proficiency'
export type SortOrder = 'asc' | 'desc'

export interface WordTranslations {
  zh?: string
  en?: string
  ja?: string
  es?: string
}

export interface Word {
  id: string
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

export type WordInput = Omit<
  Word,
  'id' | 'createdAt' | 'reviewCount' | 'lastReviewedAt'
>

export const MAX_PROFICIENCY = 5
