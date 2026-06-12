import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { buildExistingWordKeys, dedupeWordEntries } from '../lib/dedupe.js'
import {
  applyReviewResult,
  countMasteredWords,
  countTodayStudiedWords,
  isMasteredWord,
} from '../lib/proficiency.js'
import type { SortField, SortOrder, Word, WordInput } from '../types/word.js'
import { MAX_PROFICIENCY } from '../types/word.js'

interface WordRow {
  id: string
  word: string
  language: string
  translations_zh: string | null
  translations_en: string | null
  translations_ja: string | null
  translations_es: string | null
  pronunciation: string | null
  example: string | null
  example_translation: string | null
  key_syllables: string | null
  proficiency: number
  created_at: number
  last_reviewed_at: number | null
  review_count: number
}

function rowToWord(row: WordRow): Word {
  const translations: Word['translations'] = {}
  if (row.translations_zh) translations.zh = row.translations_zh
  if (row.translations_en) translations.en = row.translations_en
  if (row.translations_ja) translations.ja = row.translations_ja
  if (row.translations_es) translations.es = row.translations_es

  return {
    id: row.id,
    word: row.word,
    language: row.language as Word['language'],
    translations,
    pronunciation: row.pronunciation ?? undefined,
    example: row.example ?? undefined,
    exampleTranslation: row.example_translation ?? undefined,
    keySyllables: row.key_syllables ?? undefined,
    proficiency: row.proficiency,
    createdAt: row.created_at,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    reviewCount: row.review_count,
  }
}

const SELECT_COLUMNS = `
  id, word, language,
  translations_zh, translations_en, translations_ja, translations_es,
  pronunciation, example, example_translation, key_syllables,
  proficiency, created_at, last_reviewed_at, review_count
`

export function createWordRepository(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      language TEXT NOT NULL CHECK (language IN ('zh', 'en', 'ja', 'es')),
      translations_zh TEXT,
      translations_en TEXT,
      translations_ja TEXT,
      translations_es TEXT,
      pronunciation TEXT,
      example TEXT,
      example_translation TEXT,
      key_syllables TEXT,
      proficiency INTEGER NOT NULL DEFAULT 0 CHECK (proficiency >= 0 AND proficiency <= 5),
      created_at INTEGER NOT NULL,
      last_reviewed_at INTEGER,
      review_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_words_language ON words(language);
    CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);
    CREATE INDEX IF NOT EXISTS idx_words_proficiency ON words(proficiency);
  `)

  const selectAll = db.prepare<[], WordRow>(`SELECT ${SELECT_COLUMNS} FROM words`)
  const selectById = db.prepare<[string], WordRow | undefined>(
    `SELECT ${SELECT_COLUMNS} FROM words WHERE id = ?`,
  )

  const insertWord = db.prepare(`
    INSERT INTO words (
      id, word, language,
      translations_zh, translations_en, translations_ja, translations_es,
      pronunciation, example, example_translation, key_syllables,
      proficiency, created_at, review_count
    ) VALUES (
      @id, @word, @language,
      @translations_zh, @translations_en, @translations_ja, @translations_es,
      @pronunciation, @example, @example_translation, @key_syllables,
      @proficiency, @created_at, @review_count
    )
  `)

  return {
    getAllWords(): Word[] {
      return selectAll.all().map(rowToWord)
    },

    getWord(id: string): Word | undefined {
      const row = selectById.get(id)
      return row ? rowToWord(row) : undefined
    },

    addWords(entries: WordInput[]): { added: number; skipped: number } {
      const existing = selectAll.all().map(rowToWord)
      const existingKeys = buildExistingWordKeys(existing)
      const { unique, skipped } = dedupeWordEntries(entries, existingKeys)

      if (unique.length === 0) {
        return { added: 0, skipped }
      }

      const now = Date.now()
      const insertMany = db.transaction((items: WordInput[]) => {
        for (const entry of items) {
          insertWord.run({
            id: randomUUID(),
            word: entry.word,
            language: entry.language,
            translations_zh: entry.translations.zh ?? null,
            translations_en: entry.translations.en ?? null,
            translations_ja: entry.translations.ja ?? null,
            translations_es: entry.translations.es ?? null,
            pronunciation: entry.pronunciation ?? null,
            example: entry.example ?? null,
            example_translation: entry.exampleTranslation ?? null,
            key_syllables: entry.keySyllables ?? null,
            proficiency: entry.proficiency,
            created_at: now,
            review_count: 0,
          })
        }
      })

      insertMany(unique)
      return { added: unique.length, skipped }
    },

    updateWord(id: string, patch: Partial<Word>): boolean {
      const fields: string[] = []
      const params: Record<string, unknown> = { id }

      if (patch.word !== undefined) {
        fields.push('word = @word')
        params.word = patch.word
      }
      if (patch.language !== undefined) {
        fields.push('language = @language')
        params.language = patch.language
      }
      if (patch.translations !== undefined) {
        fields.push('translations_zh = @translations_zh')
        fields.push('translations_en = @translations_en')
        fields.push('translations_ja = @translations_ja')
        fields.push('translations_es = @translations_es')
        params.translations_zh = patch.translations.zh ?? null
        params.translations_en = patch.translations.en ?? null
        params.translations_ja = patch.translations.ja ?? null
        params.translations_es = patch.translations.es ?? null
      }
      if (patch.pronunciation !== undefined) {
        fields.push('pronunciation = @pronunciation')
        params.pronunciation = patch.pronunciation ?? null
      }
      if (patch.example !== undefined) {
        fields.push('example = @example')
        params.example = patch.example ?? null
      }
      if (patch.exampleTranslation !== undefined) {
        fields.push('example_translation = @example_translation')
        params.example_translation = patch.exampleTranslation ?? null
      }
      if (patch.keySyllables !== undefined) {
        fields.push('key_syllables = @key_syllables')
        params.key_syllables = patch.keySyllables ?? null
      }
      if (patch.proficiency !== undefined) {
        fields.push('proficiency = @proficiency')
        params.proficiency = patch.proficiency
      }
      if (patch.lastReviewedAt !== undefined) {
        fields.push('last_reviewed_at = @last_reviewed_at')
        params.last_reviewed_at = patch.lastReviewedAt ?? null
      }
      if (patch.reviewCount !== undefined) {
        fields.push('review_count = @review_count')
        params.review_count = patch.reviewCount
      }

      if (fields.length === 0) return false

      const result = db
        .prepare(`UPDATE words SET ${fields.join(', ')} WHERE id = @id`)
        .run(params)
      return result.changes > 0
    },

    markWordAsMastered(id: string): boolean {
      const word = this.getWord(id)
      if (!word || isMasteredWord(word.proficiency)) return false
      return this.updateWord(id, { proficiency: MAX_PROFICIENCY })
    },

    unmarkWordAsMastered(id: string): boolean {
      const word = this.getWord(id)
      if (!word || !isMasteredWord(word.proficiency)) return false
      return this.updateWord(id, { proficiency: 0 })
    },

    deleteWord(id: string): boolean {
      const result = db.prepare('DELETE FROM words WHERE id = ?').run(id)
      return result.changes > 0
    },

    deleteAllWords(): number {
      const count = db.prepare('SELECT COUNT(*) AS count FROM words').get() as {
        count: number
      }
      db.prepare('DELETE FROM words').run()
      return count.count
    },

    recordReview(
      id: string,
      correct: boolean,
    ): { proficiency: number; previous: number } | null {
      const word = this.getWord(id)
      if (!word) return null

      const previous = word.proficiency
      const proficiency = applyReviewResult(previous, correct)

      this.updateWord(id, {
        proficiency,
        lastReviewedAt: Date.now(),
        reviewCount: word.reviewCount + 1,
      })

      return { proficiency, previous }
    },

    getStats() {
      const words = this.getAllWords()
      return {
        total: words.length,
        mastered: countMasteredWords(words),
        studiedToday: countTodayStudiedWords(words),
      }
    },

    sortWords(words: Word[], field: SortField, order: SortOrder): Word[] {
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
    },

    close() {
      db.close()
    },
  }
}

export type WordRepository = ReturnType<typeof createWordRepository>
