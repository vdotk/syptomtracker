import {
  differenceInDays,
  parseISO,
  subDays,
  subMonths,
  format,
} from "date-fns";
import type { FlareEntry } from "../types";
import { getAllConfigsMap } from "./symptomConfig";

export type TimePeriod = "30d" | "90d" | "6m" | "1y" | "all";

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "30d": "30 days",
  "90d": "90 days",
  "6m": "6 months",
  "1y": "1 year",
  all: "All time",
};

function periodCutoff(period: TimePeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return subDays(now, 30);
    case "90d":
      return subDays(now, 90);
    case "6m":
      return subMonths(now, 6);
    case "1y":
      return subMonths(now, 12);
    case "all":
      return null;
  }
}

export function filterByPeriod(
  entries: FlareEntry[],
  period: TimePeriod,
): FlareEntry[] {
  const cutoff = periodCutoff(period);
  if (!cutoff) return entries;
  const cutoffStr = format(cutoff, "yyyy-MM-dd");
  return entries.filter((e) => e.flareStartDate >= cutoffStr);
}

// ── Current Status ──────────────────────────────────────────────────

export interface CurrentStatus {
  daysSinceLastFlare: number | null;
  isOngoing: boolean;
  avgDurationDays: number | null;
  totalEntries: number;
}

export function computeCurrentStatus(entries: FlareEntry[]): CurrentStatus {
  if (entries.length === 0) {
    return {
      daysSinceLastFlare: null,
      isOngoing: false,
      avgDurationDays: null,
      totalEntries: 0,
    };
  }

  const sorted = [...entries].sort(
    (a, b) => b.flareStartDate.localeCompare(a.flareStartDate),
  );

  const latest = sorted[0]!;
  const daysSinceLastFlare = differenceInDays(
    new Date(),
    parseISO(latest.flareStartDate),
  );
  const isOngoing = latest.flareEndDate === null;

  const withEnd = entries.filter((e) => e.flareEndDate !== null);
  let avgDurationDays: number | null = null;
  if (withEnd.length > 0) {
    const totalDays = withEnd.reduce((sum, e) => {
      return (
        sum +
        differenceInDays(parseISO(e.flareEndDate!), parseISO(e.flareStartDate))
      );
    }, 0);
    avgDurationDays = Math.round((totalDays / withEnd.length) * 10) / 10;
  }

  return {
    daysSinceLastFlare,
    isOngoing,
    avgDurationDays,
    totalEntries: entries.length,
  };
}

// ── Severity Over Time ──────────────────────────────────────────────

export interface SeverityPoint {
  date: string;
  sortDate: string;
  severity: number;
}

export function computeSeverityTimeline(
  entries: FlareEntry[],
): SeverityPoint[] {
  return [...entries]
    .sort((a, b) => a.flareStartDate.localeCompare(b.flareStartDate))
    .map((e) => ({
      date: format(parseISO(e.flareStartDate), "MMM d"),
      sortDate: e.flareStartDate,
      severity: e.overallSeverity,
    }));
}

// ── Symptom Frequency ───────────────────────────────────────────────

export interface SymptomFreq {
  key: string;
  label: string;
  shortLabel: string;
  emoji: string;
  count: number;
}

export function computeSymptomFrequency(
  entries: FlareEntry[],
): SymptomFreq[] {
  const configMap = getAllConfigsMap();
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const key of Object.keys(entry.symptoms)) {
      if (entry.symptoms[key]?.active) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const config = configMap.get(key);
      const label = config?.label ?? key;
      return {
        key,
        label,
        shortLabel: label.split(" ").map((w) => w[0]).join(""),
        emoji: config?.emoji ?? "",
        count,
      };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ── Symptom Correlations ────────────────────────────────────────────

export interface SymptomPair {
  symptomA: string;
  symptomB: string;
  emojiA: string;
  emojiB: string;
  count: number;
  percentage: number;
}

export function computeCorrelations(
  entries: FlareEntry[],
): SymptomPair[] {
  if (entries.length === 0) return [];

  const configMap = getAllConfigsMap();
  const pairCounts = new Map<string, number>();

  for (const entry of entries) {
    const active = Object.keys(entry.symptoms).filter(
      (k) => entry.symptoms[k]?.active,
    );
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const pairKey = `${active[i]}|${active[j]}`;
        pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
      }
    }
  }

  return [...pairCounts.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split("|") as [string, string];
      const configA = configMap.get(a);
      const configB = configMap.get(b);
      return {
        symptomA: configA?.label ?? a,
        symptomB: configB?.label ?? b,
        emojiA: configA?.emoji ?? "",
        emojiB: configB?.emoji ?? "",
        count,
        percentage: Math.round((count / entries.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}
