import type { Language, StudyMode, Word } from '../types/word'
import { LANGUAGE_LABELS } from '../types/word'
import {
  getOtherLanguages,
  getTextInLanguage,
  pickRandomLanguage,
} from './translations'

export interface QuizOption {
  text: string
  language: Language
}

export interface QuizQuestion {
  word: Word
  prompt: string
  answer: string
  options?: QuizOption[]
  promptLanguage?: Language
  answerLanguage?: Language
  /** 选项由多种语言混合组成 */
  mixedLanguageOptions?: boolean
  syllableTemplate?: string
  syllableAnswer?: string
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickDistractorForLang(
  pool: Word[],
  correct: Word,
  lang: Language,
  usedTexts: Set<string>,
): string | null {
  const candidates = shuffle(
    pool.filter((w) => {
      if (w.id === correct.id) return false
      const val = getTextInLanguage(w, lang)
      return val && !usedTexts.has(val)
    }),
  )
  for (const w of candidates) {
    const val = getTextInLanguage(w, lang)!
    if (!usedTexts.has(val)) return val
  }
  return null
}

function pickMixedLanguageOptions(
  word: Word,
  pool: Word[],
  otherLangs: Language[],
): { options: QuizOption[]; answer: string; answerLanguage: Language } {
  const answerLang = pickRandomLanguage(otherLangs)!
  const answer = getTextInLanguage(word, answerLang)!
  const usedTexts = new Set<string>([answer])
  const options: QuizOption[] = [{ text: answer, language: answerLang }]

  const langOrder = shuffle(otherLangs)
  for (const lang of langOrder) {
    if (options.length >= 4) break
    const text = pickDistractorForLang(pool, word, lang, usedTexts)
    if (text) {
      options.push({ text, language: lang })
      usedTexts.add(text)
    }
  }

  let guard = 0
  while (options.length < 4 && guard++ < 60) {
    const lang = pickRandomLanguage(otherLangs)!
    const text = pickDistractorForLang(pool, word, lang, usedTexts)
    if (text) {
      options.push({ text, language: lang })
      usedTexts.add(text)
    }
  }

  while (options.length < 4) {
    options.push({ text: `— ${options.length}`, language: answerLang })
  }

  return {
    options: shuffle(options).slice(0, 4),
    answer,
    answerLanguage: answerLang,
  }
}

function pickPromptLanguage(word: Word): Language {
  return pickRandomLanguage(getOtherLanguages(word)) ?? 'zh'
}

export function buildQuestion(
  word: Word,
  pool: Word[],
  mode: StudyMode,
): QuizQuestion {
  switch (mode) {
    case 'choice-to-meaning':
      return buildMeaningChoice(word, pool)
    case 'choice-to-word':
      return buildWordChoice(word, pool)
    case 'syllable-fill':
      return buildSyllableQuestion(word)
    case 'full-dictation':
      return buildDictationQuestion(word)
  }
}

function buildMeaningChoice(word: Word, pool: Word[]): QuizQuestion {
  const otherLangs = getOtherLanguages(word)
  if (otherLangs.length === 0) {
    return {
      word,
      prompt: word.word,
      answer: word.word,
      options: [{ text: word.word, language: word.language }],
      promptLanguage: word.language,
      answerLanguage: word.language,
    }
  }

  const { options, answer, answerLanguage } = pickMixedLanguageOptions(word, pool, otherLangs)

  return {
    word,
    prompt: word.word,
    answer,
    options,
    promptLanguage: word.language,
    answerLanguage,
    mixedLanguageOptions: true,
  }
}

function buildWordChoice(word: Word, pool: Word[]): QuizQuestion {
  const promptLang = pickPromptLanguage(word)
  const prompt = getTextInLanguage(word, promptLang)!
  const answer = word.word
  const distractors = pool
    .filter((w) => w.id !== word.id && w.word !== answer)
    .map((w) => w.word)
  const unique = [...new Set(distractors)]
  const wordOptions = shuffle([answer, ...shuffle(unique).slice(0, 3)])

  while (wordOptions.length < 4) {
    wordOptions.push(`— ${wordOptions.length}`)
  }

  return {
    word,
    prompt,
    answer,
    options: wordOptions.slice(0, 4).map((text) => ({
      text,
      language: word.language,
    })),
    promptLanguage: promptLang,
    answerLanguage: word.language,
  }
}

function buildSyllableQuestion(word: Word): QuizQuestion {
  const promptLang = pickPromptLanguage(word)
  const promptText = getTextInLanguage(word, promptLang)!
  const key = (word.keySyllables ?? word.word.slice(1, 3)).toLowerCase()
  const lowerWord = word.word.toLowerCase()
  const idx = lowerWord.indexOf(key)

  let template: string
  if (idx >= 0) {
    template =
      word.word.slice(0, idx) +
      '_'.repeat(key.length) +
      word.word.slice(idx + key.length)
  } else {
    template = word.word.replace(new RegExp(key, 'i'), '_'.repeat(key.length))
  }

  return {
    word,
    prompt: `${promptText}（${LANGUAGE_LABELS[promptLang]}）— 填写缺失音节`,
    answer: word.word,
    syllableTemplate: template,
    syllableAnswer: key,
    promptLanguage: promptLang,
    answerLanguage: word.language,
  }
}

function buildDictationQuestion(word: Word): QuizQuestion {
  const promptLang = pickPromptLanguage(word)
  return {
    word,
    prompt: getTextInLanguage(word, promptLang)!,
    answer: word.word,
    promptLanguage: promptLang,
    answerLanguage: word.language,
  }
}

export function checkAnswer(
  question: QuizQuestion,
  userInput: string,
  mode: StudyMode,
): boolean {
  if (mode === 'syllable-fill') {
    return userInput.trim().toLowerCase() === (question.syllableAnswer ?? '').toLowerCase()
  }
  if (mode === 'full-dictation') {
    return normalizeWord(userInput) === normalizeWord(question.answer)
  }
  return userInput.trim() === question.answer
}

function normalizeWord(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function pickStudyBatch(
  words: Word[],
  count: number,
  language?: Language,
): Word[] {
  let pool = language ? words.filter((w) => w.language === language) : words
  if (pool.length === 0) pool = words
  return shuffle(pool).slice(0, Math.min(count, pool.length))
}

const VOICE_MAP: Record<Language, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-ES',
}

export function getLanguageVoice(lang: Language): string {
  return VOICE_MAP[lang]
}

export function getSpeechLangPrefix(lang: Language): string {
  return lang === 'zh' ? 'zh' : lang === 'ja' ? 'ja' : lang === 'es' ? 'es' : 'en'
}
