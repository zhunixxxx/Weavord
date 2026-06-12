import type { QuizQuestion } from '../../lib/study'
import { PRIMARY_LANGUAGE } from '../../types/word'

interface SpanishPronunciationProps {
  question: QuizQuestion
  /** 强制显示该词的音标（如音节填空、默写听音） */
  alwaysShow?: boolean
  className?: string
}

export default function SpanishPronunciation({
  question,
  alwaysShow = false,
  className = 'mt-1 font-mono text-base text-slate-500',
}: SpanishPronunciationProps) {
  if (!question.word.pronunciation) return null

  const isSpanishPrompt =
    alwaysShow ||
    question.promptLanguage === PRIMARY_LANGUAGE ||
    question.prompt === question.word.word

  if (!isSpanishPrompt) return null

  return <p className={className}>{question.word.pronunciation}</p>
}
