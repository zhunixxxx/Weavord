import { useState } from 'react'
import { IMPORT_TEMPLATE, parseImportText } from '../lib/import'
import { useWordStore } from '../store/words'

export default function ImportPage() {
  const importWords = useWordStore((s) => s.importWords)
  const [text, setText] = useState('')
  const [useDefault, setUseDefault] = useState(true)
  const [format, setFormat] = useState<'auto' | 'markdown' | 'csv'>('auto')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [preview, setPreview] = useState<ReturnType<typeof parseImportText> | null>(null)

  const getImportText = () => (useDefault ? IMPORT_TEMPLATE : text)

  const handleFocus = () => {
    if (useDefault) {
      setUseDefault(false)
      setText('')
      setPreview(null)
      setMessage(null)
    }
  }

  const handleChange = (value: string) => {
    setUseDefault(false)
    setText(value)
  }

  const handlePreview = () => {
    const result = parseImportText(getImportText(), format)
    setPreview(result)
    setMessage(null)
  }

  const handleImport = async () => {
    const result = parseImportText(getImportText(), format)
    if (result.words.length === 0) {
      const dupHint =
        result.duplicatesSkipped > 0
          ? `（${result.duplicatesSkipped} 个重复项已跳过）`
          : ''
      setMessage({ type: 'error', text: `没有可导入的单词，请检查格式${dupHint}` })
      return
    }
    const { added, skipped } = await importWords(result.words)
    const parts = [`成功导入 ${added} 个单词`]
    if (result.duplicatesSkipped > 0) {
      parts.push(`${result.duplicatesSkipped} 个批内重复已跳过`)
    }
    if (skipped > 0) {
      parts.push(`${skipped} 个与词库重复已跳过`)
    }
    if (result.errors.length > 0) {
      parts.push(`${result.errors.length} 行格式无效`)
    }
    if (useDefault) {
      parts.push('示例单词')
    }
    setMessage({
      type: 'success',
      text: parts.join('，'),
    })
    setPreview(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">批量导入单词</h2>
        <p className="mt-1 text-slate-500">
          粘贴 Markdown 表格导入西语单词，自动录入中/英/日释义
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as typeof format)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="auto">自动识别格式</option>
          <option value="markdown">Markdown</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          格式说明
        </summary>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-800">Markdown 表格（单词书）</p>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs">
{`| 单词/短语 | 音标 | 英语 | 日语 | 释义 | 简单例句 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Buenos días** | [ˈbwenos ˈði.as] | Good morning | おはよう | 早上好 | Buenos días, ¿cómo estás? |`}
            </pre>
            <p className="mt-1 text-xs text-slate-500">
              表格列：西语单词/短语、音标、英语、日语、中文释义、例句等
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Markdown 管道符</p>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs">
{`# 西班牙语
hola | 你好 | hello | こんにちは | /ola/ | ¡Hola!`}
            </pre>
            <p className="mt-1 text-xs text-slate-500">
              字段顺序：单词 | 中文 | 英语 | 日语 | 音标 | 例句 | 例句翻译 | 关键音节
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-800">CSV 格式</p>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs">
              word,zh,en,ja,language,pronunciation,example
            </pre>
          </div>
        </div>
      </details>

      <div className="relative">
        {useDefault && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/90 p-4 font-mono text-sm whitespace-pre-wrap text-slate-600"
          >
            {IMPORT_TEMPLATE}
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          rows={14}
          className={`relative w-full rounded-2xl border p-4 font-mono text-sm outline-none ring-brand-500 focus:ring-2 ${
            useDefault
              ? 'border-slate-200 bg-transparent text-transparent caret-slate-900 focus:border-slate-200 focus:bg-white focus:text-slate-900'
              : 'border-slate-200 bg-white text-slate-900'
          }`}
          placeholder={useDefault ? undefined : '在此粘贴或输入单词…'}
        />
      </div>
      {useDefault && (
        <p className="text-xs text-slate-500">
          灰色文字为示例，直接点「确认导入」可导入这 6 个西语单词；点击输入框可清空并粘贴自己的内容
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreview}
          className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          预览解析
        </button>
        <button
          type="button"
          onClick={handleImport}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          确认导入
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {preview && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">
            预览：共 {preview.words.length} 个西语单词
          </h3>
          {preview.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              {preview.errors.map((err, i) => (
                <li key={i}>⚠ {err}</li>
              ))}
            </ul>
          )}
          {preview.duplicatesSkipped > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              已去除 {preview.duplicatesSkipped} 个批内重复词条
            </p>
          )}
          <div className="mt-3 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-3">单词</th>
                  <th className="py-2 pr-3">中文</th>
                  <th className="py-2 pr-3">英语</th>
                  <th className="py-2 pr-3">日语</th>
                </tr>
              </thead>
              <tbody>
                {preview.words.slice(0, 20).map((w, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{w.word}</td>
                    <td className="py-2 pr-3">{w.translations.zh ?? '—'}</td>
                    <td className="py-2 pr-3">{w.translations.en ?? '—'}</td>
                    <td className="py-2 pr-3">{w.translations.ja ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.words.length > 20 && (
              <p className="mt-2 text-xs text-slate-400">… 还有 {preview.words.length - 20} 个</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
