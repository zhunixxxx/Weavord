import { useEffect, useState } from 'react'
import type { QuizQuestion } from '../../lib/study'
import type { StudyMode } from '../../types/word'
import { LANGUAGE_LABELS, LANGUAGE_SHORT } from '../../types/word'
import { speakWord, speakWordAuto } from '../../lib/audio'
import SpanishPronunciation from './SpanishPronunciation'

interface MultipleChoiceProps {
  question: QuizQuestion
  mode: StudyMode
  onAnswer: (correct: boolean) => void
}

export default function MultipleChoice({ question, mode, onAnswer }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (text: string) => {
    if (revealed) return
    setSelected(text)
    setRevealed(true)
    const correct = text === question.answer
    setTimeout(() => onAnswer(correct), 800)
  }

  const isToWord = mode === 'choice-to-word'
  const promptLang = question.promptLanguage
  const mixed = question.mixedLanguageOptions

  useEffect(() => {
    if (isToWord) return
    const lang = promptLang ?? question.word.language
    void speakWordAuto(question.prompt, lang)
  }, [isToWord, question.prompt, promptLang, question.word.language])

  const hint = isToWord
    ? `请选择对应的${question.answerLanguage ? LANGUAGE_LABELS[question.answerLanguage] : '外语'}单词`
    : mixed
      ? '请选择正确释义（选项含中/英/日/西混合）'
      : `请选择正确的${question.answerLanguage ? LANGUAGE_LABELS[question.answerLanguage] : ''}释义`

  const promptLabel = promptLang ? LANGUAGE_LABELS[promptLang] : undefined

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="mb-2 text-sm text-slate-500">{hint}</p>
        {promptLabel && (
          <span className="mb-2 inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {promptLabel}
          </span>
        )}
        <p className="text-2xl font-semibold text-slate-900">{question.prompt}</p>
        <SpanishPronunciation question={question} />
        {!isToWord && question.promptLanguage === 'es' && (
          <button
            type="button"
            onClick={() => speakWord(question.prompt, question.promptLanguage!)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            🔊 听发音
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
    </div>
  )
}
