import { create } from 'zustand'
import { isMasteredWord } from '../lib/proficiency'
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
  toggleMastered: (id: string) => Promise<void>
  setProficiency: (id: string, proficiency: number) => Promise<void>
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

  toggleMastered: async (id) => {
    const word = get().words.find((w) => w.id === id)
    if (!word) return

    const mastered = isMasteredWord(word.proficiency)
    const updated = mastered
      ? await db.unmarkWordAsMastered(id)
      : await db.markWordAsMastered(id)

    if (updated) {
      set({
        words: get().words.map((w) =>
          w.id === id
            ? { ...w, proficiency: mastered ? 0 : MAX_PROFICIENCY }
            : w,
        ),
      })
    }
  },

  setProficiency: async (id, proficiency) => {
    const clamped = Math.max(0, Math.min(MAX_PROFICIENCY, proficiency))
    const word = get().words.find((w) => w.id === id)
    if (!word || word.proficiency === clamped) return

    try {
      await db.updateWord(id, { proficiency: clamped })
      set({
        words: get().words.map((w) =>
          w.id === id ? { ...w, proficiency: clamped } : w,
        ),
      })
    } catch {
      // ignore
    }
  },
}))
