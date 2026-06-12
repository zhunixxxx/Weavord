import type { Language } from '../types/word'
import { isAutoSpeakEnabled } from './settings'
import { getLanguageVoice, getSpeechLangPrefix } from './study'

let voicesLoaded = false
let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([])
      return
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      cachedVoices = voices
      voicesLoaded = true
      resolve(voices)
      return
    }

    const onVoicesChanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      voicesLoaded = true
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(cachedVoices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)

    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }, 500)
  })
}

function pickVoice(lang: Language): SpeechSynthesisVoice | null {
  const target = getLanguageVoice(lang)
  const prefix = getSpeechLangPrefix(lang)

  const exact = cachedVoices.find((v) => v.lang === target)
  if (exact) return exact

  const prefixMatch = cachedVoices.find((v) => v.lang.startsWith(prefix))
  if (prefixMatch) return prefixMatch

  return cachedVoices[0] ?? null
}

export async function speakWord(text: string, language: Language): Promise<void> {
  if (!('speechSynthesis' in window)) return

  await speakWordInternal(text, language)
}

export async function speakWordAuto(text: string, language: Language): Promise<void> {
  if (!isAutoSpeakEnabled()) return
  return speakWordInternal(text, language)
}

async function speakWordInternal(text: string, language: Language): Promise<void> {
  if (!('speechSynthesis' in window)) return

  if (!voicesLoaded) {
    await loadVoices()
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = getLanguageVoice(language)
  utterance.rate = 0.85

  const voice = pickVoice(language)
  if (voice) utterance.voice = voice

  return new Promise((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}

if (typeof window !== 'undefined') {
  loadVoices()
}
