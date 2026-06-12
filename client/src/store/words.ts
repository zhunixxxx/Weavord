import { create } from 'zustand'
import type { SortField, SortOrder, Word } from '../types/word'
import { MAX_PROFICIENCY } from '../types/word'
import * as db from '../lib/db'

interface WordStore {
  words: Word[]
  loading: boolean
  sortField: SortField
  sortOrder: SortOrder
  loadWords: () => Promise<void>
  importWords: (
    entries: Omit<Word, 'id' | 'createdAt' | 'reviewCount' | 'lastReviewedAt'>[],
  ) => Promise<{ added: number; skipped: number }>
  removeWord: (id: string) => Promise<void>
  clearAllWords: () => Promise<number>
  setSort: (field: SortField, order?: SortOrder) => void
  getSortedWords: () => Word[]
  recordReview: (id: string, correct: boolean) => Promise<{ proficiency: number; previous: number } | null>
  markAsMastered: (id: string) => Promise<void>
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  loading: true,
  sortField: 'date',
  sortOrder: 'desc',

  loadWords: async () => {
    set({ loading: true })
    const words = await db.getAllWords()
    set({ words, loading: false })
  },

  importWords: async (entries) => {
    const { added, skipped } = await db.addWords(entries)
    await get().loadWords()
    return { added, skipped }
  },

  removeWord: async (id) => {
    await db.deleteWord(id)
    set({ words: get().words.filter((w) => w.id !== id) })
  },

  clearAllWords: async () => {
    const count = await db.deleteAllWords()
    set({ words: [] })
    return count
  },

  setSort: (field, order) => {
    const current = get()
    const newOrder =
      order ??
      (current.sortField === field && current.sortOrder === 'asc' ? 'desc' : 'asc')
    set({ sortField: field, sortOrder: newOrder })
  },

  getSortedWords: () => {
    const { words, sortField, sortOrder } = get()
    return db.sortWords(words, sortField, sortOrder)
  },

  recordReview: async (id, correct) => {
    const result = await db.recordReview(id, correct)
    await get().loadWords()
    return result
  },

  markAsMastered: async (id) => {
    const updated = await db.markWordAsMastered(id)
    if (updated) {
      set({
        words: get().words.map((w) =>
          w.id === id ? { ...w, proficiency: MAX_PROFICIENCY } : w,
        ),
      })
    }
  },
}))
