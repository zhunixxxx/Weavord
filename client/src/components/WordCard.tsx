import { Link } from 'react-router-dom'
import type { Word } from '../types/word'
import { ALL_LANGUAGES, LANGUAGE_LABELS } from '../types/word'
import { getTextInLanguage } from '../lib/translations'
import { getProficiencyBadgeClass, getProficiencyLabel, isMasteredWord } from '../lib/proficiency'
import { speakWord } from '../lib/audio'

interface WordCardProps {
  word: Word
  onDelete?: (id: string) => void
  onMarkMastered?: (id: string) => void
  compact?: boolean
}

export default function WordCard({ word, onDelete, onMarkMastered, compact }: WordCardProps) {
  const mastered = isMasteredWord(word.proficiency)
  const profColor = getProficiencyBadgeClass(word.proficiency)

  const otherTranslations = ALL_LANGUAGES.filter((lang) => lang !== word.language)
    .map((lang) => ({ lang, text: getTextInLanguage(word, lang) }))
    .filter((item) => item.text)

  return (
    <article
      className={`group rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        mastered ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/words/${word.id}`}
              className="text-lg font-semibold text-slate-900 hover:text-brand-600"
            >
              {word.word}
            </Link>
            {onMarkMastered && (
              <button
                type="button"
                onClick={() => onMarkMastered(word.id)}
                disabled={mastered}
                className={`rounded-lg p-1 transition-colors ${
                  mastered
                    ? 'cursor-default text-amber-500'
                    : 'text-slate-300 hover:bg-amber-50 hover:text-amber-500'
                }`}
                title={mastered ? '已是熟词' : '标记为熟词'}
                aria-label={mastered ? '已是熟词' : '标记为熟词'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={mastered ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2Z"
                  />
                </svg>
              </button>
            )}
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${profColor}`}>
              {mastered && '★ '}
              {getProficiencyLabel(word.proficiency)}
            </span>
          </div>
          {word.pronunciation && (
            <p className="mt-0.5 font-mono text-sm text-slate-500">{word.pronunciation}</p>
          )}
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
