const STORAGE_KEY = "symptom-tracker-preset-tags";

const DEFAULT_PRESET_TAGS = [
  "stress",
  "travel",
  "weather change",
  "new medication",
  "poor sleep",
  "diet change",
];

export function getPresetTags(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESET_TAGS));
    return [...DEFAULT_PRESET_TAGS];
  }
  return JSON.parse(raw) as string[];
}

export function savePresetTags(tags: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

export function addPresetTag(tag: string): void {
  const tags = getPresetTags();
  const trimmed = tag.trim().toLowerCase();
  if (trimmed && !tags.includes(trimmed)) {
    tags.push(trimmed);
    savePresetTags(tags);
  }
}

export function removePresetTag(tag: string): void {
  const tags = getPresetTags().filter((t) => t !== tag);
  savePresetTags(tags);
}
