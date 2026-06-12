import Dexie, { type EntityTable } from 'dexie'
import type { SortField, SortOrder, Word } from '../types/word'
import { buildExistingWordKeys, dedupeWordEntries } from './dedupe'

type LegacyWord = Word & { translation?: string }

class WeavordDB extends Dexie {
  words!: EntityTable<Word, 'id'>

  constructor() {
    super('weavord')
    this.version(1).stores({
      words: 'id, word, language, proficiency, createdAt, lastReviewedAt',
    })
    this.version(2)
      .stores({
        words: 'id, word, language, proficiency, createdAt, lastReviewedAt',
      })
      .upgrade((tx) =>
        tx
          .table('words')
          .toCollection()
          .modify((raw: LegacyWord) => {
            if (!raw.translations) {
              raw.translations = {}
              if (raw.translation) {
                raw.translations.zh = raw.translation
              }
              delete raw.translation
            }
          }),
      )
  }
}

export const db = new WeavordDB()

export async function getAllWords(): Promise<Word[]> {
  return db.words.toArray()
}

export async function addWords(
  entries: Omit<Word, 'id' | 'createdAt' | 'reviewCount' | 'lastReviewedAt'>[],
): Promise<{ added: number; skipped: number }> {
  const existing = await db.words.toArray()
  const existingKeys = buildExistingWordKeys(existing)
  const { unique, skipped } = dedupeWordEntries(entries, existingKeys)

  if (unique.length === 0) {
    return { added: 0, skipped }
  }

  const now = Date.now()
  const toInsert: Word[] = unique.map((entry) => ({
    ...entry,
    id: crypto.randomUUID(),
    createdAt: now,
    reviewCount: 0,
  }))
  await db.words.bulkAdd(toInsert)
  return { added: toInsert.length, skipped }
}

export async function updateWord(id: string, patch: Partial<Word>): Promise<void> {
  await db.words.update(id, patch)
}

export async function deleteWord(id: string): Promise<void> {
  await db.words.delete(id)
}

export async function deleteAllWords(): Promise<number> {
  const count = await db.words.count()
  await db.words.clear()
  return count
}

export async function getWord(id: string): Promise<Word | undefined> {
  return db.words.get(id)
}

export function sortWords(
  words: Word[],
  field: SortField,
  order: SortOrder,
): Word[] {
  const sorted = [...words].sort((a, b) => {
    let cmp = 0
    switch (field) {
      case 'alpha':
        cmp = a.word.localeCompare(b.word, undefined, { sensitivity: 'base' })
        break
      case 'date':
        cmp = a.createdAt - b.createdAt
        break
      case 'proficiency':
        cmp = a.proficiency - b.proficiency
        break
    }
    return order === 'asc' ? cmp : -cmp
  })
  return sorted
}

export async function recordReview(id: string, correct: boolean): Promise<void> {
  const word = await db.words.get(id)
  if (!word) return

  const delta = correct ? 1 : -1
  const proficiency = Math.max(0, Math.min(5, word.proficiency + delta))

  await db.words.update(id, {
    proficiency,
    lastReviewedAt: Date.now(),
    reviewCount: word.reviewCount + 1,
  })
}

export async function getStats() {
  const words = await db.words.toArray()
  return {
    total: words.length,
    mastered: words.filter((w) => w.proficiency >= 4).length,
  }
}
