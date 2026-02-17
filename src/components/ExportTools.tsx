import { useState, useMemo, useRef } from "react";
import { format, subMonths, subDays } from "date-fns";
import { getAllEntries } from "../services/flareStorage";
import {
  downloadCSVRange,
  downloadDoctorSummary,
} from "../services/exportService";
import { downloadFullBackup, importFullBackup } from "../services/backupService";
import type { ImportResult } from "../services/backupService";

const TODAY = format(new Date(), "yyyy-MM-dd");

type QuickRange = "30d" | "90d" | "6m" | "1y" | "all" | "custom";

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "6m", label: "6 months" },
  { key: "1y", label: "1 year" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
];

function rangeStartDate(key: QuickRange, allEntries: string[]): string {
  const now = new Date();
  switch (key) {
    case "30d":
      return format(subDays(now, 30), "yyyy-MM-dd");
    case "90d":
      return format(subDays(now, 90), "yyyy-MM-dd");
    case "6m":
      return format(subMonths(now, 6), "yyyy-MM-dd");
    case "1y":
      return format(subMonths(now, 12), "yyyy-MM-dd");
    case "all":
      return allEntries.length > 0 ? allEntries[0]! : TODAY;
    case "custom":
      return TODAY;
  }
}

type ExportResult = { type: "success"; count: number } | { type: "empty" };
type BackupImportResult =
  | { type: "import-success"; detail: string }
  | { type: "import-error"; message: string };

export default function ExportTools() {
  const allEntries = useMemo(() => getAllEntries(), []);
  const allDates = useMemo(
    () =>
      allEntries
        .map((e) => e.flareStartDate)
        .sort((a, b) => a.localeCompare(b)),
    [allEntries],
  );

  const [quickRange, setQuickRange] = useState<QuickRange>("all");
  const [startDate, setStartDate] = useState(() =>
    rangeStartDate("all", allDates),
  );
  const [endDate, setEndDate] = useState(TODAY);
  const [lastResult, setLastResult] = useState<ExportResult | BackupImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleQuickRange(key: QuickRange) {
    setQuickRange(key);
    if (key !== "custom") {
      setStartDate(rangeStartDate(key, allDates));
      setEndDate(TODAY);
    }
    setLastResult(null);
  }

  function handleExportCSV() {
    const count = downloadCSVRange(startDate, endDate);
    setLastResult(count > 0 ? { type: "success", count } : { type: "empty" });
  }

  function handleExportSummary() {
    const count = downloadDoctorSummary(startDate, endDate);
    setLastResult(count > 0 ? { type: "success", count } : { type: "empty" });
  }

  function handleExportJSON() {
    downloadFullBackup();
    setLastResult({ type: "success", count: allEntries.length });
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const result: ImportResult = importFullBackup(text);
        const parts: string[] = [];
        parts.push(`${result.entriesCount} entries`);
        if (result.configsCount > 0) parts.push(`${result.configsCount} symptom configs`);
        if (result.tagsCount > 0) parts.push(`${result.tagsCount} tags`);
        if (result.settingsImported) parts.push("settings");
        setLastResult({ type: "import-success", detail: `Imported: ${parts.join(", ")}. Reload to see all changes.` });
      } catch (err) {
        setLastResult({
          type: "import-error",
          message: err instanceof Error ? err.message : "Failed to import",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const entryCount = useMemo(
    () =>
      allEntries.filter(
        (e) =>
          e.flareStartDate >= startDate && e.flareStartDate <= endDate,
      ).length,
    [allEntries, startDate, endDate],
  );

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Export</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Download your data or a doctor summary
        </p>
      </div>

      {/* Date Range */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Date Range
        </h2>

        {/* Quick range pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => handleQuickRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                quickRange === r.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="export-start"
              className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              From
            </label>
            <input
              id="export-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setQuickRange("custom");
                setLastResult(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label
              htmlFor="export-end"
              className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              To
            </label>
            <input
              id="export-end"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setQuickRange("custom");
                setLastResult(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Entry count badge */}
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          {entryCount} {entryCount === 1 ? "entry" : "entries"} in selected
          range
        </p>
      </div>

      {/* Export CSV */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Export as CSV
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Spreadsheet with one row per entry. Each symptom gets its own
            columns for active status, severity, and notes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={entryCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Doctor Summary */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Doctor Summary
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            A readable report with flare count, average duration, most
            frequent symptoms, severity trend, and a compact timeline.
            Bring this to your appointment.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportSummary}
          disabled={entryCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white py-3.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 active:scale-[0.98] disabled:opacity-40 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          Export Doctor Summary
        </button>
      </div>

      {/* Data Backup */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Data Backup
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Full backup includes entries, symptom configs, tags, and settings.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700 active:scale-[0.98] dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export All
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-800 bg-white py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 active:scale-[0.98] dark:border-gray-500 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>
      </div>

      {/* Result toast */}
      {lastResult && (
        <div
          className={`rounded-xl p-3 text-center text-sm font-medium ${
            lastResult.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : lastResult.type === "import-success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : lastResult.type === "import-error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {lastResult.type === "success"
            ? `Downloaded ${lastResult.count} ${lastResult.count === 1 ? "entry" : "entries"}.`
            : lastResult.type === "import-success"
              ? lastResult.detail
              : lastResult.type === "import-error"
                ? `Import failed: ${lastResult.message}`
                : "No entries found in the selected date range."}
        </div>
      )}

      {/* Data info */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Your Data
        </h2>
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <p>
            {allEntries.length} total{" "}
            {allEntries.length === 1 ? "entry" : "entries"} stored in this
            browser
          </p>
          {allDates.length > 0 && (
            <p>
              Date range: {allDates[0]} to {allDates[allDates.length - 1]}
            </p>
          )}
          <p className="pt-1 text-gray-400 dark:text-gray-500">
            All data is stored locally in your browser. Nothing is sent to any
            server.
          </p>
        </div>
      </div>
    </div>
  );
}
