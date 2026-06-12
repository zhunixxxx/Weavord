import type { Language, Word, WordTranslations } from '../types/word'
import { ALL_LANGUAGES, MEANING_LANGUAGES } from '../types/word'

export function getTextInLanguage(word: Word, lang: Language): string | undefined {
  if (lang === word.language) return word.word
  return word.translations[lang]
}

export function getAvailableLanguages(word: Word): Language[] {
  const langs = new Set<Language>([word.language])
  for (const lang of ALL_LANGUAGES) {
    if (word.translations[lang]) langs.add(lang)
  }
  return ALL_LANGUAGES.filter((lang) => langs.has(lang))
}

export function getOtherLanguages(word: Word): Language[] {
  return MEANING_LANGUAGES.filter((lang) => Boolean(getTextInLanguage(word, lang)))
}

export function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

export function pickRandomLanguage(langs: Language[]): Language | undefined {
  return pickRandom(langs)
}

export function buildTranslations(
  primary: Language,
  values: Partial<WordTranslations> & { word: string },
): WordTranslations {
  const translations: WordTranslations = {
    zh: values.zh,
    en: values.en,
    ja: values.ja,
    es: values.es,
  }
  translations[primary] = values.word
  return translations
}

export function getAllSearchableText(word: Word): string {
  const parts = [word.word, ...ALL_LANGUAGES.map((lang) => getTextInLanguage(word, lang))]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

export function formatTranslationSummary(word: Word): string {
  return ALL_LANGUAGES.filter((lang) => lang !== word.language)
    .map((lang) => {
      const text = getTextInLanguage(word, lang)
      return text ? `${lang === 'zh' ? '中' : lang === 'en' ? '英' : lang === 'ja' ? '日' : '西'}:${text}` : null
    })
    .filter(Boolean)
    .join(' · ')
}
