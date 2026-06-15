const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL ?? 'https://api.deepseek.com/v1/chat/completions'

export const SMART_IMPORT_SYSTEM_PROMPT = `你是西班牙语词汇助手。用户会提供零散的笔记（多种格式均可），你需要将其转换为 Weavord 批量导入用的 Markdown 表格。

只输出 Markdown 表格，不要任何解释、标题或代码块围栏。

表格格式（严格遵循）：
| 单词/短语 | 音标 | 英语 | 日语 | 释义 | 简单例句 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **西语单词** | [IPA音标] | English | 日语 | 中文释义 | 西语例句 |

规则：
1. 第一列西语单词/短语用 **粗体** 包裹
2. 音标用方括号 [ ] 包裹，使用 IPA
3. 尽量补全英语、日语、中文释义；用户已给出的释义优先采用
4. 例句用简单自然的西班牙语
5. 支持解析：gato = cat/猫、gato: 猫 (cat)、每行一条、带编号列表等
6. 若用户未提供某语言释义，请合理补全
7. 只输出表格（含表头与分隔行），不要 \`\`\` 代码块
8. 动词给出原型`

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/i)
  if (fenced) return fenced[1].trim()
  return trimmed
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export async function convertNotesToMarkdown(
  notes: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      messages: [
        { role: 'system', content: SMART_IMPORT_SYSTEM_PROMPT },
        { role: 'user', content: notes.trim() },
      ],
      temperature: 0.3,
    }),
  })

  const data = (await response.json()) as ChatCompletionResponse

  if (!response.ok) {
    const msg = data.error?.message ?? `DeepSeek API 错误 (${response.status})`
    throw new Error(msg)
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('模型未返回有效内容')
  }

  return stripCodeFences(content)
}
