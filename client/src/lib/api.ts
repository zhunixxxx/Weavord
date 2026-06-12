import type { SortField, SortOrder, Word } from '../types/word'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    let message = `请求失败 (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export async function getAllWords(): Promise<Word[]> {
  return request<Word[]>('/words')
}

export async function getWord(id: string): Promise<Word | undefined> {
  const res = await fetch(`${API_BASE}/words/${id}`)
  if (res.status === 404) return undefined
  if (!res.ok) {
    let message = `请求失败 (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return res.json() as Promise<Word>
}

export async function addWords(
  entries: Omit<Word, 'id' | 'createdAt' | 'reviewCount' | 'lastReviewedAt'>[],
): Promise<{ added: number; skipped: number }> {
  return request('/words/import', {
    method: 'POST',
    body: JSON.stringify({ words: entries }),
  })
}

export async function updateWord(id: string, patch: Partial<Word>): Promise<void> {
  await request(`/words/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function markWordAsMastered(id: string): Promise<boolean> {
  try {
    await request(`/words/${id}/master`, { method: 'POST' })
    return true
  } catch {
    return false
  }
}

export async function deleteWord(id: string): Promise<void> {
  await request(`/words/${id}`, { method: 'DELETE' })
}

export async function deleteAllWords(): Promise<number> {
  const result = await request<{ deleted: number }>('/words', { method: 'DELETE' })
  return result.deleted
}

export async function recordReview(
  id: string,
  correct: boolean,
): Promise<{ proficiency: number; previous: number } | null> {
  try {
    return await request(`/words/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ correct }),
    })
  } catch (err) {
    if (err instanceof Error && err.message.includes('不存在')) {
      return null
    }
    throw err
  }
}

export async function getStats() {
  return request<{ total: number; mastered: number; studiedToday: number }>('/words/stats')
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

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
