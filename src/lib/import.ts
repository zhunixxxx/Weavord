import type { ImportResult, Language, WordTranslations } from '../types/word'
import { PRIMARY_LANGUAGE } from '../types/word'
import { dedupeWordEntries } from './dedupe'

const COLUMN_ALIASES: Record<string, string[]> = {
  word: ['单词/短语', '单词', '短语', 'word', 'phrase', 'palabra', '词语', '外语', '表达'],
  translationZh: ['释义', '中文释义', '中文', '意思', '含义', 'translation', '翻译'],
  translationEn: ['英语', 'english', '英文', 'en'],
  translationJa: ['日语', 'japanese', 'ja', '日本語', '日文'],
  pronunciation: ['音标', 'pronunciation', '读音', 'ipa'],
  example: ['简单例句', '例句', 'example', '例句原文', '例句/短语'],
  exampleTranslation: ['例句翻译', 'exampletranslation', '例句中文'],
  keySyllables: ['关键音节', 'keysyllables', '音节'],
}

type WordEntry = ImportResult['words'][0]

function normalizeHeader(text: string): string {
  return stripMarkdown(text)
    .replace(/[\s:：/／]/g, '')
    .trim()
    .toLowerCase()
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^!\s*/, '')
    .trim()
}

function parseTableCells(line: string): string[] {
  const parts = line.split('|').map((p) => stripMarkdown(p.trim()))
  if (parts[0] === '') parts.shift()
  if (parts[parts.length - 1] === '') parts.pop()
  return parts
}

function isTableSeparatorLine(line: string): boolean {
  const cells = parseTableCells(line)
  if (cells.length === 0) return false
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')))
}

function isSkippableLine(line: string): boolean {
  const trimmed = line.trim()
  return trimmed === '' || /^-{3,}$/.test(trimmed) || trimmed === '---'
}

function buildColumnMap(headers: string[]): Partial<Record<keyof typeof COLUMN_ALIASES, number>> {
  const normalized = headers.map(normalizeHeader)
  const mapping: Partial<Record<keyof typeof COLUMN_ALIASES, number>> = {}

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < normalized.length; i++) {
      const header = normalized[i]
      const matched = aliases.some((alias) => {
        const a = alias.toLowerCase()
        return header === a || header.includes(a) || a.includes(header)
      })
      if (matched) {
        mapping[field as keyof typeof COLUMN_ALIASES] = i
        break
      }
    }
  }

  return mapping
}

function hasTranslationColumns(map: Partial<Record<keyof typeof COLUMN_ALIASES, number>>): boolean {
  return (
    map.translationZh !== undefined ||
    map.translationEn !== undefined ||
    map.translationJa !== undefined
  )
}

function isTableHeaderLine(line: string): boolean {
  if (!line.includes('|')) return false
  const cells = parseTableCells(line)
  if (cells.length < 2) return false
  const map = buildColumnMap(cells)
  return map.word !== undefined && hasTranslationColumns(map)
}

function cellAt(cells: string[], index: number | undefined): string | undefined {
  if (index === undefined || index < 0 || index >= cells.length) return undefined
  const value = cells[index].trim()
  return value || undefined
}

function normalizePronunciation(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return `/${trimmed.slice(1, -1)}/`
  }
  return trimmed
}

function buildWordTranslations(
  word: string,
  language: Language,
  cells: string[],
  columnMap: Partial<Record<keyof typeof COLUMN_ALIASES, number>>,
): WordTranslations {
  const translations: WordTranslations = {
    zh: cellAt(cells, columnMap.translationZh),
    en: cellAt(cells, columnMap.translationEn),
    ja: cellAt(cells, columnMap.translationJa),
  }
  translations[language] = word
  return translations
}

function hasAnyTranslation(translations: WordTranslations, language: Language): boolean {
  return (['zh', 'en', 'ja', 'es'] as Language[]).some(
    (lang) => lang !== language && Boolean(translations[lang]),
  )
}

/** 去掉括号内的语法标注，如 (阴性特例) (m.) (f.) */
export function stripWordAnnotations(word: string): string {
  return word
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTableRow(
  cells: string[],
  columnMap: Partial<Record<keyof typeof COLUMN_ALIASES, number>>,
): WordEntry | null {
  const word = cellAt(cells, columnMap.word)
  if (!word) return null

  const translations = buildWordTranslations(word, PRIMARY_LANGUAGE, cells, columnMap)
  if (!hasAnyTranslation(translations, PRIMARY_LANGUAGE)) return null

  return {
    word,
    language: PRIMARY_LANGUAGE,
    translations,
    pronunciation: normalizePronunciation(cellAt(cells, columnMap.pronunciation)),
    example: cellAt(cells, columnMap.example),
    exampleTranslation: cellAt(cells, columnMap.exampleTranslation),
    keySyllables: cellAt(cells, columnMap.keySyllables) ?? guessKeySyllables(word),
    proficiency: 0,
  }
}

function parsePipeLine(line: string): WordEntry | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|')) return null

  const parts = trimmed.split('|').map((p) => stripMarkdown(p.trim()))
  if (parts.length < 2 || !parts[0]) return null

  const [
    word,
    zh,
    en,
    ja,
    pronunciation,
    example,
    exampleTranslation,
    keySyllables,
  ] = parts

  const translations: WordTranslations = {
    zh: zh || undefined,
    en: en || undefined,
    ja: ja || undefined,
  }
  translations[PRIMARY_LANGUAGE] = word

  if (!hasAnyTranslation(translations, PRIMARY_LANGUAGE)) return null

  return {
    word,
    language: PRIMARY_LANGUAGE,
    translations,
    pronunciation: normalizePronunciation(pronunciation),
    example: example || undefined,
    exampleTranslation: exampleTranslation || undefined,
    keySyllables: keySyllables || guessKeySyllables(word),
    proficiency: 0,
  }
}

function guessKeySyllables(word: string): string {
  const clean = stripWordAnnotations(word).replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '')
  if (clean.length <= 3) return clean.toLowerCase()
  const mid = Math.floor(clean.length / 3)
  const len = Math.max(2, Math.floor(clean.length / 3))
  return clean.slice(mid, mid + len).toLowerCase()
}

export function parseMarkdown(text: string, _defaultLanguage: Language = PRIMARY_LANGUAGE): ImportResult {
  const words: ImportResult['words'] = []
  const errors: string[] = []

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    if (isSkippableLine(line)) continue

    if (/^#+\s/.test(line.trim())) {
      continue
    }

    if (isTableHeaderLine(line)) {
      const headers = parseTableCells(line)
      const columnMap = buildColumnMap(headers)
      i++

      if (i < lines.length && isTableSeparatorLine(lines[i])) {
        i++
      }

      while (i < lines.length) {
        const dataLine = lines[i]
        if (isSkippableLine(dataLine) || /^#+\s/.test(dataLine.trim())) break
        if (!dataLine.includes('|')) break
        if (isTableHeaderLine(dataLine)) break
        if (isTableSeparatorLine(dataLine)) {
          i++
          continue
        }

        const cells = parseTableCells(dataLine)
        const parsed = parseTableRow(cells, columnMap)
        if (parsed) {
          words.push(parsed)
        } else {
          errors.push(`第 ${i + 1} 行表格数据无效：${dataLine.trim()}`)
        }
        i++
      }
      i--
      continue
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().replace(/^[-*]\s+/, '')
      const parsed = parsePipeLine(content)
      if (parsed) {
        words.push(parsed)
      } else {
        errors.push(`第 ${lineNum} 行格式无效：${line}`)
      }
      continue
    }

    if (line.includes('|') && !line.trim().startsWith('|')) {
      const parsed = parsePipeLine(line)
      if (parsed) words.push(parsed)
    } else if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = parseTableCells(line)
      if (cells.length >= 2) {
        const fallbackMap = buildColumnMap([
          '单词/短语',
          '音标',
          '英语',
          '日语',
          '释义',
          '简单例句',
        ].slice(0, cells.length))
        const parsed = parseTableRow(cells, fallbackMap)
        if (parsed) words.push(parsed)
      }
    }
  }

  return finalizeImportResult({ words, errors })
}

function finalizeImportResult(result: Omit<ImportResult, 'duplicatesSkipped'>): ImportResult {
  const { unique, skipped } = dedupeWordEntries(result.words)
  return { ...result, words: unique, duplicatesSkipped: skipped }
}

function csvCol(header: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = header.indexOf(name)
    if (idx >= 0) return idx
  }
  return -1
}

export function parseCsv(text: string): ImportResult {
  const words: ImportResult['words'] = []
  const errors: string[] = []
  const lines = text.trim().split('\n')
  if (lines.length === 0) return finalizeImportResult({ words, errors })

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const hasHeader =
    header.includes('word') ||
    header.includes('单词') ||
    header.includes('zh') ||
    header.includes('translation')

  if (hasHeader && csvCol(header, 'word', '单词') < 0) {
    errors.push('CSV 表头需包含 word/单词 列')
    return finalizeImportResult({ words, errors })
  }

  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',').map((c) => c.trim())
    const lineNum = i + 1

    if (hasHeader) {
      const word = cols[csvCol(header, 'word', '单词')]
      if (!word) {
        errors.push(`第 ${lineNum} 行缺少单词`)
        continue
      }

      const language: Language = PRIMARY_LANGUAGE

      const translations: WordTranslations = {
        zh: cols[csvCol(header, 'zh', 'translation', '释义', '中文')] || undefined,
        en: cols[csvCol(header, 'en', 'english', '英语')] || undefined,
        ja: cols[csvCol(header, 'ja', 'japanese', '日语')] || undefined,
        es: cols[csvCol(header, 'es', 'spanish', '西班牙语')] || undefined,
      }
      translations[language] = word

      if (!hasAnyTranslation(translations, language)) {
        errors.push(`第 ${lineNum} 行缺少至少一种其他语言释义`)
        continue
      }

      words.push({
        word,
        language,
        translations,
        pronunciation: cols[csvCol(header, 'pronunciation', '音标')] || undefined,
        example: cols[csvCol(header, 'example', '例句')] || undefined,
        exampleTranslation:
          cols[csvCol(header, 'exampletranslation', '例句翻译')] || undefined,
        keySyllables:
          cols[csvCol(header, 'keysyllables', '关键音节')] || guessKeySyllables(word),
        proficiency: 0,
      })
    } else if (cols.length >= 2) {
      const translations: WordTranslations = { zh: cols[1] }
      translations.en = cols[0]
      words.push({
        word: cols[0],
        language: PRIMARY_LANGUAGE,
        translations,
        keySyllables: guessKeySyllables(cols[0]),
        proficiency: 0,
      })
    } else {
      errors.push(`第 ${lineNum} 行格式无效`)
    }
  }

  return finalizeImportResult({ words, errors })
}

export function parseImportText(
  text: string,
  format: 'markdown' | 'csv' | 'auto',
  _defaultLanguage: Language = PRIMARY_LANGUAGE,
): ImportResult {
  if (format === 'csv') return parseCsv(text)
  if (format === 'markdown') return parseMarkdown(text)

  const trimmed = text.trim()
  if (trimmed.includes(',') && trimmed.split('\n')[0].includes('word')) {
    return parseCsv(text)
  }
  return parseMarkdown(text)
}

export const IMPORT_TEMPLATE = `| 单词/短语 | 音标 | 英语 | 日语 | 释义 | 简单例句 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Buenos días** | [ˈbwenos ˈði.as] | Good morning | おはよう / こんにちは | 早上好 | Buenos días, ¿cómo estás? |
| **Buenas tardes** | [ˈbwenas ˈtaɾðes] | Good afternoon | こんにちは | 下午好 | Buenas tardes, señor. |
| **¡Gracias!** | [ˈɡɾaθjas] | Thank you! | ありがとう！ | 谢谢！ | ¡Gracias por la comida! |
| **¡Chao!** | [tʃao] | Bye! | バイバイ！ | 再见！ | ¡Chao! Nos vemos mañana. |
| **Hasta luego** | [ˈasta ˈlweɣo] | See you later | またね / では後ほど | 稍后见/再见 | Tengo que irme, ¡hasta luego! |
| **Qué tal** | [ke tal] | How's it going? | 元気？ / どう？ | 怎么样/你好吗 | Hola, ¿qué tal todo? |
`
