const API_KEY_STORAGE = 'weavord-deepseek-api-key'

export function getDeepSeekApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setDeepSeekApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim())
}

export async function convertNotesToMarkdown(
  notes: string,
  apiKey?: string,
): Promise<string> {
  const res = await fetch('/api/import/smart-convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, apiKey: apiKey?.trim() || undefined }),
  })

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

  const data = (await res.json()) as { markdown: string }
  return data.markdown
}

export const SMART_IMPORT_PLACEHOLDER = `gato = cat / 猫
perro: 狗 (dog)
libro — 书 / book / 本
Buenos días = 早上好 / good morning`
