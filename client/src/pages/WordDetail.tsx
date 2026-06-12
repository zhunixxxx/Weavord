import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getWord } from '../lib/db'
import { speakWord, isSpeechSupported } from '../lib/audio'
import { getTextInLanguage } from '../lib/translations'
import {
  getProficiencyLabel,
  getProficiencyProgress,
  isMasteredWord,
} from '../lib/proficiency'
import type { Language, Word } from '../types/word'
import { ALL_LANGUAGES, LANGUAGE_LABELS, MAX_PROFICIENCY } from '../types/word'

const LANG_COLORS: Record<Language, string> = {
  zh: 'border-red-100 bg-red-50',
  en: 'border-blue-100 bg-blue-50',
  ja: 'border-pink-100 bg-pink-50',
  es: 'border-amber-100 bg-amber-50',
}

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [word, setWord] = useState<Word | null>(null)

  useEffect(() => {
    if (id) getWord(id).then((w) => setWord(w ?? null))
  }, [id])

  if (!word) {
    return (
      <div className="text-center text-slate-500">
        <p>单词不存在</p>
        <Link to="/words" className="mt-4 inline-block text-brand-600 hover:underline">
          返回单词表
        </Link>
      </div>
    )
  }

  const mastered = isMasteredWord(word.proficiency)
  const profTextColor = mastered ? 'text-amber-700' : 'text-brand-600'
  const progress = getProficiencyProgress(word.proficiency)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/words" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        ← 返回单词表
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 px-6 py-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs font-medium">
                {LANGUAGE_LABELS[word.language]} · 词条
              </span>
              <h1 className="mt-3 text-4xl font-bold">{word.word}</h1>
              {word.pronunciation && (
                <p className="mt-2 font-mono text-lg text-brand-100">{word.pronunciation}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => speakWord(word.word, word.language)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm transition-colors hover:bg-white/30"
              title="播放发音"
            >
              🔊
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              多语言释义
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {ALL_LANGUAGES.map((lang) => {
                const text = getTextInLanguage(word, lang)
                if (!text) return null
                const isPrimary = lang === word.language
                return (
                  <div
                    key={lang}
                    className={`rounded-2xl border p-4 ${LANG_COLORS[lang]} ${isPrimary ? 'ring-2 ring-brand-400' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {LANGUAGE_LABELS[lang]}
                        {isPrimary && (
                          <span className="ml-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">
                            词条
                          </span>
                        )}
                      </p>
                      {lang !== 'zh' && (
                        <button
                          type="button"
                          onClick={() => speakWord(text, lang)}
                          className="rounded-lg px-2 py-0.5 text-xs text-slate-500 hover:bg-white/80"
                          title={`朗读${LANGUAGE_LABELS[lang]}`}
                        >
                          🔊
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-medium text-slate-900">{text}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {word.example && (
            <section className="rounded-2xl bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                例句
              </h2>
              <p className="mt-2 text-lg italic text-slate-800">"{word.example}"</p>
              {word.exampleTranslation && (
                <p className="mt-2 text-slate-600">{word.exampleTranslation}</p>
              )}
              <button
                type="button"
                onClick={() => speakWord(word.example!, word.language)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-slate-200 hover:bg-brand-50"
              >
                🔊 朗读例句
              </button>
            </section>
          )}

          <section className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    熟练度
                  </p>
                  <p className={`mt-1 text-lg font-semibold ${profTextColor}`}>
                    {mastered && '★ '}
                    {getProficiencyLabel(word.proficiency)}
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  {word.proficiency}/{MAX_PROFICIENCY}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    mastered ? 'bg-amber-500' : 'bg-brand-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {mastered
                  ? '已是熟词，继续复习可保持记忆'
                  : `再答对 ${MAX_PROFICIENCY - word.proficiency} 次可成为熟词`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">复习次数</p>
              <p className="mt-1 font-semibold text-slate-800">{word.reviewCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">添加日期</p>
              <p className="mt-1 font-semibold text-slate-800">
                {new Date(word.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            {word.keySyllables && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">关键音节</p>
                <p className="mt-1 font-mono font-semibold text-slate-800">
                  {word.keySyllables}
                </p>
              </div>
            )}
            </div>
          </section>

          {!isSpeechSupported() && (
            <p className="text-xs text-amber-600">
              当前浏览器不支持语音合成，发音功能可能不可用
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
