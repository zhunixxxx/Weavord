const STORAGE_KEY = 'weavord-settings'

export interface AppSettings {
  autoSpeak: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSpeak: true,
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function isAutoSpeakEnabled(): boolean {
  return loadSettings().autoSpeak
}

export function setAutoSpeakEnabled(enabled: boolean): void {
  saveSettings({ ...loadSettings(), autoSpeak: enabled })
}

export function getSettings(): AppSettings {
  return loadSettings()
}
