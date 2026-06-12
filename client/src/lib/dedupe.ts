import type { Language, Word } from '../types/word'

type WordLike = Pick<Word, 'language' | 'word'>

function stripWordAnnotations(word: string): string {
  return word
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getWordDedupeKey(language: Language, word: string): string {
  const normalized = stripWordAnnotations(word).normalize('NFC').trim().toLowerCase()
  return `${language}:${normalized}`
}

export function dedupeWordEntries<T extends WordLike>(
  entries: T[],
  existingKeys = new Set<string>(),
): { unique: T[]; skipped: number } {
  const seen = new Set(existingKeys)
  const unique: T[] = []
  let skipped = 0

  for (const entry of entries) {
    const key = getWordDedupeKey(entry.language, entry.word)
    if (seen.has(key)) {
      skipped++
      continue
    }
    seen.add(key)
    unique.push(entry)
  }

  return { unique, skipped }
}

export function buildExistingWordKeys(words: WordLike[]): Set<string> {
  return new Set(words.map((w) => getWordDedupeKey(w.language, w.word)))
}
