import { v4 as uuidv4 } from "uuid";
import type { Severity } from "../types";
import {
  SYMPTOM_KEYS,
  SYMPTOM_LABELS,
  SYMPTOM_EMOJI,
  ENUM_SEVERITY_SYMPTOMS,
  IMAGE_LINK_SYMPTOMS,
} from "../types";

export type SymptomInputType = "slider" | "enum" | "toggle" | "temperature";

export interface SymptomConfig {
  id: string;
  label: string;
  emoji: string;
  inputType: SymptomInputType;
  supportsImageLinks: boolean;
  archived: boolean;
  order: number;
  isBuiltIn: boolean;
}

const STORAGE_KEY = "symptom-tracker-symptom-config";

function buildDefaultConfigs(): SymptomConfig[] {
  return SYMPTOM_KEYS.map((key, index) => ({
    id: key,
    label: SYMPTOM_LABELS[key],
    emoji: SYMPTOM_EMOJI[key],
    inputType: ENUM_SEVERITY_SYMPTOMS.has(key) ? "enum" as const : "slider" as const,
    supportsImageLinks: IMAGE_LINK_SYMPTOMS.has(key),
    archived: false,
    order: index,
    isBuiltIn: true,
  }));
}

export function migrateIfNeeded(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDefaultConfigs()));
  }
}

export function getSymptomConfigs(): SymptomConfig[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaults = buildDefaultConfigs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw) as SymptomConfig[];
}

export function saveSymptomConfigs(configs: SymptomConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function getActiveConfigs(): SymptomConfig[] {
  return getSymptomConfigs()
    .filter((c) => !c.archived)
    .sort((a, b) => a.order - b.order);
}

export function getAllConfigsMap(): Map<string, SymptomConfig> {
  const map = new Map<string, SymptomConfig>();
  for (const c of getSymptomConfigs()) {
    map.set(c.id, c);
  }
  return map;
}

export function getConfigById(id: string): SymptomConfig | undefined {
  return getSymptomConfigs().find((c) => c.id === id);
}

export function addCustomSymptom(
  label: string,
  emoji: string,
  inputType: SymptomInputType,
  supportsImageLinks: boolean,
): SymptomConfig {
  const configs = getSymptomConfigs();
  const maxOrder = configs.length > 0 ? Math.max(...configs.map((c) => c.order)) : -1;
  const newConfig: SymptomConfig = {
    id: `custom_${uuidv4().slice(0, 8)}`,
    label,
    emoji,
    inputType,
    supportsImageLinks,
    archived: false,
    order: maxOrder + 1,
    isBuiltIn: false,
  };
  configs.push(newConfig);
  saveSymptomConfigs(configs);
  return newConfig;
}

export function updateSymptomConfig(
  id: string,
  updates: Partial<Omit<SymptomConfig, "id" | "isBuiltIn">>,
): void {
  const configs = getSymptomConfigs();
  const index = configs.findIndex((c) => c.id === id);
  if (index === -1) return;
  configs[index] = { ...configs[index]!, ...updates };
  saveSymptomConfigs(configs);
}

export function archiveSymptom(id: string): void {
  updateSymptomConfig(id, { archived: true });
}

export function unarchiveSymptom(id: string): void {
  const configs = getSymptomConfigs();
  const maxOrder = configs.filter((c) => !c.archived).length > 0
    ? Math.max(...configs.filter((c) => !c.archived).map((c) => c.order))
    : -1;
  const index = configs.findIndex((c) => c.id === id);
  if (index === -1) return;
  configs[index] = { ...configs[index]!, archived: false, order: maxOrder + 1 };
  saveSymptomConfigs(configs);
}

export function reorderSymptom(id: string, direction: "up" | "down"): void {
  const configs = getSymptomConfigs();
  const active = configs
    .filter((c) => !c.archived)
    .sort((a, b) => a.order - b.order);
  const idx = active.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= active.length) return;

  const thisConfig = active[idx]!;
  const swapConfig = active[swapIdx]!;
  const tempOrder = thisConfig.order;

  // Update in the full configs array
  const thisFullIdx = configs.findIndex((c) => c.id === thisConfig.id);
  const swapFullIdx = configs.findIndex((c) => c.id === swapConfig.id);
  if (thisFullIdx >= 0) configs[thisFullIdx] = { ...configs[thisFullIdx]!, order: swapConfig.order };
  if (swapFullIdx >= 0) configs[swapFullIdx] = { ...configs[swapFullIdx]!, order: tempOrder };

  saveSymptomConfigs(configs);
}

export function defaultSeverityForConfig(config: SymptomConfig): number | Severity {
  switch (config.inputType) {
    case "enum":
      return "mild";
    case "temperature":
      return 98.6;
    case "slider":
    case "toggle":
    default:
      return 0;
  }
}
