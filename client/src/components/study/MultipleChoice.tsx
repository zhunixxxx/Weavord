import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { QuizQuestion } from '../../lib/study'
import type { StudyMode } from '../../types/word'
import { LANGUAGE_SHORT } from '../../types/word'
import { playAnswerFeedback, speakWord, speakWordAuto } from '../../lib/audio'
import ProficiencyStars from '../ProficiencyStars'
import SpanishPronunciation from './SpanishPronunciation'

interface MultipleChoiceProps {
  question: QuizQuestion
  mode: StudyMode
  onAnswer: (correct: boolean, selected?: string) => void | Promise<void>
  onContinue?: () => void
  reviewProficiency?: { previous: number; next: number } | null
  onViewWordCard?: (selected: string) => void
  restoredWrong?: { selected: string }
}

export default function MultipleChoice({
  question,
  mode,
  onAnswer,
  onContinue,
  reviewProficiency,
  onViewWordCard,
  restoredWrong,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(restoredWrong?.selected ?? null)
  const [revealed, setRevealed] = useState(!!restoredWrong)

  const handleSelect = (text: string) => {
    if (revealed) return
    setSelected(text)
    setRevealed(true)
    const correct = text === question.answer
    playAnswerFeedback(correct)
    if (correct) {
      setTimeout(() => void onAnswer(correct), 800)
      return
    }
    void onAnswer(correct, text)
  }

  const isToWord = mode === 'choice-to-word'
  const promptLang = question.promptLanguage
  const mixed = question.mixedLanguageOptions

  useEffect(() => {
    if (isToWord) return
    const lang = promptLang ?? question.word.language
    void speakWordAuto(question.prompt, lang)
  }, [isToWord, question.prompt, promptLang, question.word.language])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 sm:p-5">
        <p className="text-2xl font-semibold text-slate-900">{question.prompt}</p>
        <SpanishPronunciation question={question} />
        {!isToWord && question.promptLanguage === 'es' && (
          <button
            type="button"
            onClick={() => speakWord(question.prompt, question.promptLanguage!)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            🔊 听发音
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {question.options?.map((option) => {
          let style = 'bg-white ring-1 ring-slate-200 hover:ring-brand-300 hover:bg-brand-50'
          if (revealed && option.text === question.answer) {
            style = 'bg-emerald-50 ring-2 ring-emerald-500 text-emerald-800'
          } else if (revealed && option.text === selected && option.text !== question.answer) {
            style = 'bg-red-50 ring-2 ring-red-400 text-red-800'
          } else if (selected === option.text) {
            style = 'bg-brand-50 ring-2 ring-brand-500'
          }

          return (
            <button
              key={`${option.language}-${option.text}`}
              type="button"
              disabled={revealed}
              onClick={() => handleSelect(option.text)}
              className={`rounded-2xl px-4 py-4 text-left transition-all ${style}`}
            >
              {mixed && (
                <span className="mb-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {LANGUAGE_SHORT[option.language]}
                </span>
              )}
              <span className="block text-base font-medium">{option.text}</span>
            </button>
          )
        })}
      </div>

      {revealed && selected !== question.answer && (
        <div className="space-y-4">
          {reviewProficiency && (
            <div className="flex justify-center">
              <ProficiencyStars
                proficiency={reviewProficiency.next}
                previous={reviewProficiency.previous}
                size="md"
              />
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={`/words/${question.word.id}`}
              state={{ from: '/study' }}
              onClick={() => selected && onViewWordCard?.(selected)}
              className="rounded-xl bg-white px-5 py-2.5 text-center text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-50"
            >
              查看单词卡
            </Link>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              下一题
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
