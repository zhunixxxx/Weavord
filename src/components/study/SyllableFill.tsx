import { useState } from 'react'
import type { FormEvent } from 'react'
import type { QuizQuestion } from '../../lib/study'
import { checkAnswer } from '../../lib/study'
import { speakWord } from '../../lib/audio'

interface SyllableFillProps {
  question: QuizQuestion
  onAnswer: (correct: boolean) => void
}

export default function SyllableFill({ question, onAnswer }: SyllableFillProps) {
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState(false)
  const correct = revealed && checkAnswer(question, input, 'syllable-fill')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (revealed || !input.trim()) return
    setRevealed(true)
    const isCorrect = checkAnswer(question, input, 'syllable-fill')
    setTimeout(() => onAnswer(isCorrect), 1000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="mb-2 text-sm text-slate-500">填写缺失的关键音节</p>
        <p className="text-xl font-semibold text-slate-900">{question.prompt}</p>
        <p className="mt-4 font-mono text-3xl tracking-widest text-brand-700">
          {question.syllableTemplate}
        </p>
        <button
          type="button"
          onClick={() => speakWord(question.word.word, question.word.language)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700"
        >
          🔊 听发音
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={revealed}
          placeholder="输入缺失音节…"
          autoComplete="off"
          autoCapitalize="off"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xl font-mono outline-none ring-brand-500 focus:ring-2 disabled:opacity-60"
        />
        {!revealed ? (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full rounded-2xl bg-brand-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          >
            确认
          </button>
        ) : (
          <div
            className={`rounded-2xl p-4 text-center ${
              correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {correct ? '✓ 正确！' : `✗ 正确答案：${question.syllableAnswer}`}
            <p className="mt-1 text-sm opacity-80">完整单词：{question.word.word}</p>
          </div>
        )}
      </form>
    </div>
  )
}
