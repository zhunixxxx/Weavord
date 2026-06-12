import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { countMasteredWords, countTodayStudiedWords } from '../lib/proficiency'
import { useWordStore } from '../store/words'

export default function HomePage() {
  const loadWords = useWordStore((s) => s.loadWords)
  const words = useWordStore((s) => s.words)
  const [stats, setStats] = useState({ total: 0, mastered: 0, studiedToday: 0 })

  useEffect(() => {
    loadWords()
  }, [loadWords])

  useEffect(() => {
    setStats({
      total: words.length,
      mastered: countMasteredWords(words),
      studiedToday: countTodayStudiedWords(words),
    })
  }, [words])

  const cards = [
    {
      to: '/import',
      icon: '📥',
      title: '批量导入',
      desc: '导入西语单词及中/英/日释义',
      color: 'from-violet-500 to-indigo-600',
    },
    {
      to: '/words',
      icon: '📚',
      title: '单词表',
      desc: '浏览、排序与管理西语词库',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      to: '/study',
      icon: '✏️',
      title: '开始背诵',
      desc: '四选一混合考查中/英/日释义',
      color: 'from-orange-500 to-rose-600',
    },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <h2 className="text-2xl font-bold sm:text-3xl">Bienvenidos 👋</h2>
        <p className="mt-2 max-w-lg text-brand-100">
          西班牙语背单词，支持中/英/日多语释义与多种练习模式。
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: '今日已背', value: stats.studiedToday },
            { label: '西语词数', value: stats.total },
            { label: '熟词', value: stats.mastered },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-brand-100">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-2xl shadow-sm`}
            >
              {card.icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600">
              {card.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
          </Link>
        ))}
      </section>

      {stats.total === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">还没有单词，先去导入一些吧！</p>
          <Link
            to="/import"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            立即导入
          </Link>
        </div>
      )}
    </div>
  )
}
