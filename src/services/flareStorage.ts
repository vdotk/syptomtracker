import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import type {
  FlareEntry,
  SymptomsRecord,
} from "../types";
import { getActiveConfigs, getSymptomConfigs, defaultSeverityForConfig } from "./symptomConfig";

const STORAGE_KEY = "symptom-tracker-entries";

function readAll(): FlareEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FlareEntry[];
}

function writeAll(entries: FlareEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createDefaultSymptoms(): SymptomsRecord {
  const symptoms: SymptomsRecord = {};
  for (const config of getActiveConfigs()) {
    symptoms[config.id] = {
      active: false,
      severity: defaultSeverityForConfig(config),
    };
  }
  return symptoms;
}

export function getAllEntries(): FlareEntry[] {
  return readAll();
}

export function getEntryById(id: string): FlareEntry | undefined {
  return readAll().find((e) => e.id === id);
}

export function createEntry(
  data: Omit<FlareEntry, "id" | "createdAt">,
): FlareEntry {
  const entry: FlareEntry = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  const entries = readAll();
  entries.push(entry);
  writeAll(entries);
  return entry;
}

export function updateEntry(
  id: string,
  updates: Partial<Omit<FlareEntry, "id" | "createdAt">>,
): FlareEntry {
  const entries = readAll();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error(`Entry not found: ${id}`);
  }
  const updated = { ...entries[index]!, ...updates };
  entries[index] = updated;
  writeAll(entries);
  return updated;
}

export function deleteEntry(id: string): void {
  const entries = readAll();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) {
    throw new Error(`Entry not found: ${id}`);
  }
  writeAll(filtered);
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(): string {
  const entries = readAll();
  const configs = getSymptomConfigs();

  // Build header — include all configs (active + archived) so historical data has columns
  const symptomHeaders = configs.flatMap((config) => [
    `${config.label} Active`,
    `${config.label} Severity`,
    `${config.label} Notes`,
  ]);

  const headers = [
    "ID",
    "Created At",
    "Flare Start",
    "Flare End",
    ...symptomHeaders,
    "Overall Severity",
    "Notes",
    "Tags",
  ];

  const rows = entries.map((entry) => {
    const symptomCols = configs.flatMap((config) => {
      const s = entry.symptoms[config.id] ?? { active: false, severity: 0 };
      return [
        s.active ? "Yes" : "No",
        s.active ? String(s.severity) : "",
        s.notes ?? "",
      ];
    });

    return [
      entry.id,
      entry.createdAt,
      entry.flareStartDate,
      entry.flareEndDate ?? "",
      ...symptomCols,
      String(entry.overallSeverity),
      entry.notes,
      entry.tags.join("; "),
    ].map(escapeCsvField);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCSV(): void {
  const csv = exportToCSV();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `symptom-tracker-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function getLastEntry(): FlareEntry | undefined {
  const entries = readAll();
  if (entries.length === 0) return undefined;
  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

export function exportAllJSON(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

export function importJSON(json: string): number {
  const parsed = JSON.parse(json) as FlareEntry[];
  if (!Array.isArray(parsed)) throw new Error("Invalid format: expected an array");
  for (const entry of parsed) {
    if (!entry.id || !entry.createdAt || !entry.symptoms) {
      throw new Error("Invalid entry format");
    }
  }
  writeAll(parsed);
  return parsed.length;
}

export function restoreEntry(entry: FlareEntry): void {
  const entries = readAll();
  entries.push(entry);
  writeAll(entries);
}
