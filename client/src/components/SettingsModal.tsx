import { useEffect, useState } from 'react'
import { isSpeechSupported } from '../lib/audio'
import { getSettings, setAutoSpeakEnabled } from '../lib/settings'
import { useWordStore } from '../store/words'

type SettingsSection = 'data' | 'audio'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

const menuItems: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'audio', label: '音频', icon: '🔊' },
  { id: 'data', label: '数据', icon: '🗂️' },
]

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [section, setSection] = useState<SettingsSection>('audio')
  const [autoSpeak, setAutoSpeak] = useState(() => getSettings().autoSpeak)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const wordCount = useWordStore((s) => s.words.length)
  const clearAllWords = useWordStore((s) => s.clearAllWords)
  const loadWords = useWordStore((s) => s.loadWords)

  useEffect(() => {
    if (open) loadWords()
  }, [open, loadWords])

  if (!open) return null

  const handleDeleteAll = async () => {
    if (wordCount === 0) {
      setMessage('当前没有单词可删除')
      return
    }
    if (!window.confirm(`确定删除全部 ${wordCount} 个单词？此操作不可恢复。`)) {
      return
    }

    setDeleting(true)
    setMessage(null)
    try {
      const count = await clearAllWords()
      setMessage(`已删除 ${count} 个单词`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭设置"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative flex h-[600px] w-[840px] max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex h-full w-full flex-col sm:flex-row">
          <aside className="shrink-0 border-b border-slate-200 bg-slate-50 sm:h-full sm:w-52 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between px-4 py-4 sm:block">
              <h2 id="settings-title" className="text-lg font-semibold text-slate-900">
                设置
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 sm:hidden"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <nav className="flex gap-1 px-2 pb-3 sm:flex-col sm:px-2 sm:pb-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id)
                    setMessage(null)
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    section === item.id
                      ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="hidden shrink-0 justify-end px-5 pt-5 sm:flex sm:px-6 sm:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:-mt-1"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 sm:px-6 sm:pb-6">
            {section === 'audio' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">发音</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    在「选释义」练习或打开单词详情时，自动朗读词条发音
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <input
                    type="checkbox"
                    checked={!autoSpeak}
                    onChange={(e) => {
                      const enabled = !e.target.checked
                      setAutoSpeak(enabled)
                      setAutoSpeakEnabled(enabled)
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="block font-medium text-slate-900">关闭自动发音</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      开启后不再自动播放；手动点击 🔊 按钮仍可发音
                    </span>
                  </span>
                </label>

                {!isSpeechSupported() && (
                  <p className="text-sm text-amber-600">
                    当前浏览器不支持语音合成，发音功能可能不可用
                  </p>
                )}
              </div>
            )}

            {section === 'data' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">数据管理</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    当前共 {wordCount} 个单词，数据保存在本机浏览器中
                  </p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                  <p className="font-medium text-slate-900">删除所有单词</p>
                  <p className="mt-1 text-sm text-slate-600">
                    清空本地词库，包括所有释义、熟练度与复习记录。此操作不可恢复。
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={deleting || wordCount === 0}
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deleting ? '删除中…' : '删除所有单词'}
                  </button>
                </div>

                {message && (
                  <p className="text-sm font-medium text-emerald-700">{message}</p>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
