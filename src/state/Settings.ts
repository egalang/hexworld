const SETTINGS_KEY = 'hex_settings';

export interface SettingsData {
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function defaultSettings(): SettingsData {
  return {
    musicVolume: 0.25,
    sfxVolume: 0.55,
    fullscreen: false,
  };
}

function loadRaw(): SettingsData {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<SettingsData>;
    return {
      musicVolume: typeof parsed.musicVolume === 'number' ? clamp01(parsed.musicVolume) : defaultSettings().musicVolume,
      sfxVolume: typeof parsed.sfxVolume === 'number' ? clamp01(parsed.sfxVolume) : defaultSettings().sfxVolume,
      fullscreen: typeof parsed.fullscreen === 'boolean' ? parsed.fullscreen : defaultSettings().fullscreen,
    };
  } catch {
    return defaultSettings();
  }
}

let cached: SettingsData | null = null;

function getData(): SettingsData {
  if (!cached) cached = loadRaw();
  return cached;
}

function commit(): void {
  if (cached) localStorage.setItem(SETTINGS_KEY, JSON.stringify(cached));
}

export function getSettings(): SettingsData {
  return { ...getData() };
}

export function updateMusicVolume(volume: number): void {
  const data = getData();
  data.musicVolume = clamp01(volume);
  commit();
}

export function updateSfxVolume(volume: number): void {
  const data = getData();
  data.sfxVolume = clamp01(volume);
  commit();
}

export function toggleFullscreen(): boolean {
  const data = getData();
  data.fullscreen = !data.fullscreen;
  commit();
  return data.fullscreen;
}

export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
  cached = null;
}
