export interface AppSettings {
  darkMode: boolean;
  remindersEnabled: boolean;
  reminderTime: string; // HH:MM format
}

const SETTINGS_KEY = "symptom-tracker-settings";
const LAST_REMINDER_KEY = "symptom-tracker-last-reminder-date";

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  remindersEnabled: false,
  reminderTime: "20:00",
};

export function getSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getLastReminderDate(): string | null {
  return localStorage.getItem(LAST_REMINDER_KEY);
}

export function setLastReminderDate(date: string): void {
  localStorage.setItem(LAST_REMINDER_KEY, date);
}
