import { differenceInDays, parseISO, format } from "date-fns";
import type { FlareEntry } from "../types";
import { getAllEntries } from "./flareStorage";
import { getSymptomConfigs, getAllConfigsMap } from "./symptomConfig";
import { computeSymptomFrequency } from "./stats";

// ── Helpers ─────────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function filterByDateRange(
  entries: FlareEntry[],
  startDate: string,
  endDate: string,
): FlareEntry[] {
  return entries.filter(
    (e) => e.flareStartDate >= startDate && e.flareStartDate <= endDate,
  );
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── CSV Export ──────────────────────────────────────────────────────

function buildCSV(entries: FlareEntry[]): string {
  const configs = getSymptomConfigs();

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

export function downloadCSVRange(startDate: string, endDate: string): number {
  const entries = filterByDateRange(getAllEntries(), startDate, endDate);
  if (entries.length === 0) return 0;

  const csv = buildCSV(entries);
  const filename = `symptom-tracker-${startDate}-to-${endDate}.csv`;
  triggerDownload(csv, filename, "text/csv");
  return entries.length;
}

// ── Doctor Summary ──────────────────────────────────────────────────

function computeSeverityTrend(
  entries: FlareEntry[],
): { label: string; firstHalfAvg: number; secondHalfAvg: number } {
  if (entries.length < 2) {
    return { label: "Not enough data", firstHalfAvg: 0, secondHalfAvg: 0 };
  }

  const sorted = [...entries].sort((a, b) =>
    a.flareStartDate.localeCompare(b.flareStartDate),
  );

  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const avg = (arr: FlareEntry[]) =>
    arr.reduce((s, e) => s + e.overallSeverity, 0) / arr.length;

  const firstHalfAvg = Math.round(avg(firstHalf) * 10) / 10;
  const secondHalfAvg = Math.round(avg(secondHalf) * 10) / 10;

  const diff = secondHalfAvg - firstHalfAvg;
  let label: string;
  if (diff > 0.5) label = "Worsening";
  else if (diff < -0.5) label = "Improving";
  else label = "Stable";

  return { label, firstHalfAvg, secondHalfAvg };
}

function formatDuration(entry: FlareEntry): string {
  if (!entry.flareEndDate) return "ongoing";
  const days = differenceInDays(
    parseISO(entry.flareEndDate),
    parseISO(entry.flareStartDate),
  );
  if (days === 0) return "< 1 day";
  return `${days} day${days !== 1 ? "s" : ""}`;
}

function formatDateRange(entry: FlareEntry): string {
  const start = format(parseISO(entry.flareStartDate), "MMM d, yyyy");
  if (!entry.flareEndDate) return `${start} \u2013 ongoing`;
  const end = format(parseISO(entry.flareEndDate), "MMM d, yyyy");
  return `${start} \u2013 ${end}`;
}

function buildDoctorSummary(
  entries: FlareEntry[],
  startDate: string,
  endDate: string,
): string {
  const configMap = getAllConfigsMap();

  const sorted = [...entries].sort((a, b) =>
    b.flareStartDate.localeCompare(a.flareStartDate),
  );

  const rangeStart = format(parseISO(startDate), "MMMM d, yyyy");
  const rangeEnd = format(parseISO(endDate), "MMMM d, yyyy");
  const generated = format(new Date(), "MMMM d, yyyy");

  // Overview stats
  const withEnd = entries.filter((e) => e.flareEndDate !== null);
  let avgDuration = "N/A";
  if (withEnd.length > 0) {
    const totalDays = withEnd.reduce(
      (sum, e) =>
        sum +
        differenceInDays(
          parseISO(e.flareEndDate!),
          parseISO(e.flareStartDate),
        ),
      0,
    );
    avgDuration = `${Math.round((totalDays / withEnd.length) * 10) / 10} days`;
  }

  const ongoingCount = entries.filter((e) => e.flareEndDate === null).length;

  // Symptom frequency
  const freqs = computeSymptomFrequency(entries);

  // Severity trend
  const trend = computeSeverityTrend(entries);

  // Build text
  const lines: string[] = [];

  lines.push("AUTOIMMUNE SYMPTOM TRACKER \u2014 DOCTOR SUMMARY");
  lines.push("=".repeat(50));
  lines.push(`Generated: ${generated}`);
  lines.push(`Report Period: ${rangeStart} \u2013 ${rangeEnd}`);
  lines.push("");

  lines.push("OVERVIEW");
  lines.push("-".repeat(50));
  lines.push(`Total Flares Logged:    ${entries.length}`);
  lines.push(`Average Flare Duration: ${avgDuration}`);
  lines.push(
    `Currently Ongoing:      ${ongoingCount > 0 ? `Yes (${ongoingCount})` : "No"}`,
  );
  lines.push("");

  lines.push("MOST FREQUENT SYMPTOMS");
  lines.push("-".repeat(50));
  if (freqs.length === 0) {
    lines.push("No symptoms logged in this period.");
  } else {
    freqs.forEach((s, i) => {
      const pct = Math.round((s.count / entries.length) * 100);
      lines.push(
        `${String(i + 1).padStart(2)}. ${s.label.padEnd(22)} ${s.count}/${entries.length} flares (${pct}%)`,
      );
    });
  }
  lines.push("");

  lines.push("SEVERITY TREND");
  lines.push("-".repeat(50));
  lines.push(`Overall Trend: ${trend.label}`);
  if (entries.length >= 2) {
    lines.push(
      `  Earlier period avg severity: ${trend.firstHalfAvg}/10`,
    );
    lines.push(
      `  Recent period avg severity:  ${trend.secondHalfAvg}/10`,
    );
  }
  lines.push("");

  lines.push("FLARE TIMELINE");
  lines.push("-".repeat(50));
  if (sorted.length === 0) {
    lines.push("No flares in this period.");
  } else {
    for (const entry of sorted) {
      const activeSymptoms = Object.keys(entry.symptoms)
        .filter((k) => entry.symptoms[k]?.active)
        .map((k) => configMap.get(k)?.label ?? k);

      const datePart = formatDateRange(entry).padEnd(32);
      const durPart = `(${formatDuration(entry)})`.padEnd(14);
      const sevPart = `Sev: ${entry.overallSeverity}/10`;

      lines.push(`${datePart} ${durPart} ${sevPart}`);

      if (activeSymptoms.length > 0) {
        lines.push(`  Symptoms: ${activeSymptoms.join(", ")}`);
      }

      if (entry.notes) {
        const preview =
          entry.notes.length > 80
            ? entry.notes.slice(0, 80) + "..."
            : entry.notes;
        lines.push(`  Notes: ${preview}`);
      }

      if (entry.tags.length > 0) {
        lines.push(`  Tags: ${entry.tags.join(", ")}`);
      }

      lines.push("");
    }
  }

  lines.push("=".repeat(50));
  lines.push("End of report.");

  return lines.join("\n");
}

export function downloadDoctorSummary(
  startDate: string,
  endDate: string,
): number {
  const entries = filterByDateRange(getAllEntries(), startDate, endDate);
  if (entries.length === 0) return 0;

  const summary = buildDoctorSummary(entries, startDate, endDate);
  const filename = `doctor-summary-${startDate}-to-${endDate}.txt`;
  triggerDownload(summary, filename, "text/plain");
  return entries.length;
}
