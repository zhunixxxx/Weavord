import type { Language } from '../types/word'
import { isAutoSpeakEnabled, isSoundEffectsEnabled } from './settings'
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

let feedbackCtx: AudioContext | null = null

function getFeedbackContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  const AudioCtx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null

  if (!feedbackCtx) feedbackCtx = new AudioCtx()
  if (feedbackCtx.state === 'suspended') void feedbackCtx.resume()
  return feedbackCtx
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  delay: number,
  type: OscillatorType = 'sine',
  volume = 0.14,
): void {
  const start = ctx.currentTime + delay
  const end = start + duration

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, end)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(end + 0.05)
}

export function playAnswerFeedback(correct: boolean): void {
  if (!isSoundEffectsEnabled()) return

  const ctx = getFeedbackContext()
  if (!ctx) return

  if (correct) {
    playTone(ctx, 523.25, 0.1, 0)
    playTone(ctx, 659.25, 0.12, 0.09)
    playTone(ctx, 783.99, 0.16, 0.18)
  } else {
    playTone(ctx, 220, 0.22, 0, 'triangle', 0.11)
    playTone(ctx, 185, 0.28, 0.1, 'triangle', 0.09)
  }
}

export function playStudyCompleteFeedback(): void {
  if (!isSoundEffectsEnabled()) return

  const ctx = getFeedbackContext()
  if (!ctx) return

  const fanfare = [
    { freq: 523.25, delay: 0, duration: 0.14, volume: 0.12 },
    { freq: 659.25, delay: 0.1, duration: 0.14, volume: 0.13 },
    { freq: 783.99, delay: 0.2, duration: 0.14, volume: 0.14 },
    { freq: 987.77, delay: 0.32, duration: 0.18, volume: 0.15 },
    { freq: 1174.66, delay: 0.46, duration: 0.22, volume: 0.15 },
    { freq: 1567.98, delay: 0.62, duration: 0.28, volume: 0.13 },
  ] as const

  for (const note of fanfare) {
    playTone(ctx, note.freq, note.duration, note.delay, 'sine', note.volume)
  }

  playTone(ctx, 523.25, 0.4, 0.58, 'triangle', 0.05)
  playTone(ctx, 659.25, 0.4, 0.58, 'triangle', 0.05)
  playTone(ctx, 783.99, 0.4, 0.58, 'triangle', 0.05)
  playTone(ctx, 1046.5, 0.45, 0.58, 'sine', 0.07)
}

if (typeof window !== 'undefined') {
  loadVoices()
}
