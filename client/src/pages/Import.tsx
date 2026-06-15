import { useState } from 'react'
import { IMPORT_TEMPLATE, parseImportText } from '../lib/import'
import type { ImportResult } from '../types/word'
import {
  convertNotesToMarkdown,
  getDeepSeekApiKey,
  SMART_IMPORT_PLACEHOLDER,
} from '../lib/smartImport'
import { useWordStore } from '../store/words'

type ImportMode = 'paste' | 'smart'
type Message = { type: 'success' | 'error'; text: string }

function ImportPreview({ preview }: { preview: ImportResult }) {
  return (
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
  )
}

export default function ImportPage() {
  const importWords = useWordStore((s) => s.importWords)
  const [mode, setMode] = useState<ImportMode>('smart')

  const [text, setText] = useState('')
  const [useDefault, setUseDefault] = useState(true)
  const [format, setFormat] = useState<'auto' | 'markdown' | 'csv'>('auto')
  const [message, setMessage] = useState<Message | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)

  const [notes, setNotes] = useState('')
  const [generatedMarkdown, setGeneratedMarkdown] = useState('')
  const [generating, setGenerating] = useState(false)

  const getPasteImportText = () => (useDefault ? IMPORT_TEMPLATE : text)

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

  const handlePreviewPaste = () => {
    const result = parseImportText(getPasteImportText(), format)
    setPreview(result)
    setMessage(null)
  }

  const handlePreviewSmart = () => {
    if (!generatedMarkdown.trim()) {
      setMessage({ type: 'error', text: '请先生成 Markdown 表格' })
      return
    }
    const result = parseImportText(generatedMarkdown, 'markdown')
    setPreview(result)
    setMessage(null)
  }

  const runImport = async (importText: string, importFormat: typeof format | 'markdown', opts?: { isExample?: boolean }) => {
    const result = parseImportText(importText, importFormat)
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
    if (opts?.isExample) {
      parts.push('示例单词')
    }
    setMessage({ type: 'success', text: parts.join('，') })
    setPreview(null)
  }

  const handleImportPaste = () => runImport(getPasteImportText(), format, { isExample: useDefault })

  const handleImportSmart = () => {
    if (!generatedMarkdown.trim()) {
      setMessage({ type: 'error', text: '请先生成 Markdown 表格' })
      return
    }
    runImport(generatedMarkdown, 'markdown')
  }

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setMessage({ type: 'error', text: '请先输入笔记内容' })
      return
    }
    const apiKey = getDeepSeekApiKey()
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: '请先在右上角设置 → AI 导入 中配置 DeepSeek API Key' })
      return
    }

    setGenerating(true)
    setMessage(null)
    setPreview(null)

    try {
      const markdown = await convertNotesToMarkdown(notes, apiKey)
      setGeneratedMarkdown(markdown)
      const result = parseImportText(markdown, 'markdown')
      setPreview(result)
      if (result.words.length === 0) {
        setMessage({
          type: 'error',
          text: '已生成 Markdown，但解析不到有效单词，请检查生成结果或手动编辑',
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '生成失败，请稍后重试',
      })
    } finally {
      setGenerating(false)
    }
  }

  const switchMode = (next: ImportMode) => {
    setMode(next)
    setMessage(null)
    setPreview(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">批量导入单词</h2>
        <p className="mt-1 text-slate-500">
          用 AI 将零散笔记转为标准格式，或直接粘贴 Markdown 表格导入西语单词
        </p>
      </div>

      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => switchMode('smart')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${mode === 'smart'
            ? 'bg-white text-brand-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          ✨智能导入
        </button>
        <button
          type="button"
          onClick={() => switchMode('paste')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${mode === 'paste'
            ? 'bg-white text-brand-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          📋格式导入
        </button>
      </div>

      {mode === 'smart' && (
        <>
          <p className="text-sm text-slate-600">
            输入零散的西语笔记（任意格式均可），AI 会按批量导入规则生成 Markdown 表格并自动预览。
            需先在设置中配置 DeepSeek API Key。
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">笔记内容</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-900 outline-none ring-brand-500 focus:ring-2"
              placeholder={SMART_IMPORT_PLACEHOLDER}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? '生成中…' : '生成 Markdown'}
            </button>
            {generatedMarkdown && (
              <>
                <button
                  type="button"
                  onClick={handlePreviewSmart}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  重新预览
                </button>
                <button
                  type="button"
                  onClick={handleImportSmart}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  确认导入
                </button>
              </>
            )}
          </div>

          {generatedMarkdown && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                生成的 Markdown（可手动编辑）
              </label>
              <textarea
                value={generatedMarkdown}
                onChange={(e) => {
                  setGeneratedMarkdown(e.target.value)
                  setPreview(null)
                }}
                rows={10}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-900 outline-none ring-brand-500 focus:ring-2"
              />
            </div>
          )}
        </>
      )}

      {mode === 'paste' && (
        <>
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
              className={`relative w-full rounded-2xl border p-4 font-mono text-sm outline-none ring-brand-500 focus:ring-2 ${useDefault
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
              onClick={handlePreviewPaste}
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              预览解析
            </button>
            <button
              type="button"
              onClick={handleImportPaste}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              确认导入
            </button>
          </div>
        </>
      )}

      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-red-50 text-red-800'
            }`}
        >
          {message.text}
        </div>
      )}

      {preview && <ImportPreview preview={preview} />}
    </div>
  )
}
