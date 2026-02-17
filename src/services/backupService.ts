import { format } from "date-fns";
import type { FlareEntry } from "../types";
import type { SymptomConfig } from "./symptomConfig";
import type { AppSettings } from "./settings";
import { getAllEntries } from "./flareStorage";
import { getSymptomConfigs, saveSymptomConfigs } from "./symptomConfig";
import { getPresetTags, savePresetTags } from "./tagConfig";
import { getSettings, saveSettings } from "./settings";

export interface FullBackup {
  version: 2;
  exportedAt: string;
  entries: FlareEntry[];
  symptomConfigs: SymptomConfig[];
  presetTags: string[];
  settings: AppSettings;
}

export interface ImportResult {
  entriesCount: number;
  configsCount: number;
  tagsCount: number;
  settingsImported: boolean;
}

export function createFullBackup(): string {
  const backup: FullBackup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    entries: getAllEntries(),
    symptomConfigs: getSymptomConfigs(),
    presetTags: getPresetTags(),
    settings: getSettings(),
  };
  return JSON.stringify(backup, null, 2);
}

export function downloadFullBackup(): void {
  const json = createFullBackup();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `symptom-tracker-full-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function isFullBackup(parsed: unknown): parsed is FullBackup {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    "entries" in parsed &&
    "symptomConfigs" in parsed
  );
}

function isLegacyBackup(parsed: unknown): parsed is FlareEntry[] {
  return Array.isArray(parsed);
}

export function importFullBackup(json: string): ImportResult {
  const parsed = JSON.parse(json) as unknown;

  if (isFullBackup(parsed)) {
    // Validate entries
    if (!Array.isArray(parsed.entries)) {
      throw new Error("Invalid backup: entries is not an array");
    }
    for (const entry of parsed.entries) {
      if (!entry.id || !entry.createdAt || !entry.symptoms) {
        throw new Error("Invalid entry format in backup");
      }
    }

    // Import entries
    const ENTRIES_KEY = "symptom-tracker-entries";
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(parsed.entries));

    // Import symptom configs
    let configsCount = 0;
    if (Array.isArray(parsed.symptomConfigs) && parsed.symptomConfigs.length > 0) {
      saveSymptomConfigs(parsed.symptomConfigs);
      configsCount = parsed.symptomConfigs.length;
    }

    // Import preset tags
    let tagsCount = 0;
    if (Array.isArray(parsed.presetTags) && parsed.presetTags.length > 0) {
      savePresetTags(parsed.presetTags);
      tagsCount = parsed.presetTags.length;
    }

    // Import settings
    let settingsImported = false;
    if (parsed.settings && typeof parsed.settings === "object") {
      saveSettings(parsed.settings);
      settingsImported = true;
    }

    return {
      entriesCount: parsed.entries.length,
      configsCount,
      tagsCount,
      settingsImported,
    };
  }

  if (isLegacyBackup(parsed)) {
    // Legacy: plain array of entries
    for (const entry of parsed) {
      if (!entry.id || !entry.createdAt || !entry.symptoms) {
        throw new Error("Invalid entry format");
      }
    }
    const ENTRIES_KEY = "symptom-tracker-entries";
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(parsed));
    return {
      entriesCount: parsed.length,
      configsCount: 0,
      tagsCount: 0,
      settingsImported: false,
    };
  }

  throw new Error("Unrecognized backup format");
}
