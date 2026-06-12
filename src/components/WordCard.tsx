import { Link } from 'react-router-dom'
import type { Word } from '../types/word'
import { ALL_LANGUAGES, LANGUAGE_LABELS, PROFICIENCY_LABELS } from '../types/word'
import { getTextInLanguage } from '../lib/translations'
import { speakWord } from '../lib/audio'

interface WordCardProps {
  word: Word
  onDelete?: (id: string) => void
  compact?: boolean
}

export default function WordCard({ word, onDelete, compact }: WordCardProps) {
  const profColor = [
    'bg-slate-100 text-slate-600',
    'bg-amber-50 text-amber-700',
    'bg-yellow-50 text-yellow-700',
    'bg-emerald-50 text-emerald-700',
    'bg-teal-50 text-teal-700',
    'bg-brand-50 text-brand-700',
  ][word.proficiency]

  const otherTranslations = ALL_LANGUAGES.filter((lang) => lang !== word.language)
    .map((lang) => ({ lang, text: getTextInLanguage(word, lang) }))
    .filter((item) => item.text)

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/words/${word.id}`}
              className="text-lg font-semibold text-slate-900 hover:text-brand-600"
            >
              {word.word}
            </Link>
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${profColor}`}>
              {PROFICIENCY_LABELS[word.proficiency]}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {otherTranslations.map(({ lang, text }) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-sm text-slate-700"
              >
                <span className="text-xs font-medium text-slate-400">
                  {LANGUAGE_LABELS[lang]}
                </span>
                {text}
              </span>
            ))}
          </div>
          {!compact && word.pronunciation && (
            <p className="mt-2 font-mono text-sm text-slate-500">{word.pronunciation}</p>
          )}
          {!compact && word.example && (
            <p className="mt-2 text-sm italic text-slate-600">"{word.example}"</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => speakWord(word.word, word.language)}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
            title="播放发音"
            aria-label="播放发音"
          >
            🔊
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(word.id)}
              className="rounded-xl p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="删除"
              aria-label="删除单词"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
