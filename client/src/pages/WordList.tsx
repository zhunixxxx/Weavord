import { useEffect, useMemo, useState } from 'react'
import WordCard from '../components/WordCard'
import SortControls from '../components/SortControls'
import { useWordStore } from '../store/words'
import { getAllSearchableText } from '../lib/translations'

export default function WordListPage() {
  const loadWords = useWordStore((s) => s.loadWords)
  const sortField = useWordStore((s) => s.sortField)
  const sortOrder = useWordStore((s) => s.sortOrder)
  const setSort = useWordStore((s) => s.setSort)
  const removeWord = useWordStore((s) => s.removeWord)
  const markAsMastered = useWordStore((s) => s.markAsMastered)
  const getSortedWords = useWordStore((s) => s.getSortedWords)
  const loading = useWordStore((s) => s.loading)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadWords()
  }, [loadWords])

  const words = getSortedWords()
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return words
    return words.filter((w) => getAllSearchableText(w).includes(q))
  }, [words, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">单词表</h2>
          <p className="mt-1 text-slate-500">共 {filtered.length} 个西语单词</p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索西语单词或中/英/日释义…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-brand-500 focus:ring-2 sm:max-w-xs"
        />
      </div>

      <SortControls field={sortField} order={sortOrder} onChange={setSort} />

      {loading ? (
        <p className="text-center text-slate-500">加载中…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          暂无单词，请先去导入页面添加
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onDelete={removeWord}
              onMarkMastered={markAsMastered}
            />
          ))}
        </div>
      )}
    </div>
  )
}
