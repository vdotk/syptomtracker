import { useState, useCallback, useMemo } from "react";
import { differenceInDays, parseISO, format } from "date-fns";
import type { FlareEntry } from "../types";
import { getAllEntries, updateEntry } from "../services/flareStorage";
import { getAllConfigsMap } from "../services/symptomConfig";
import type { SymptomConfig } from "../services/symptomConfig";

const TODAY = format(new Date(), "yyyy-MM-dd");

function severityBadge(severity: number) {
  if (severity <= 3)
    return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
  if (severity <= 5)
    return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
  if (severity <= 7)
    return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700";
  return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
}

function formatDateShort(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

function getDuration(entry: FlareEntry): string {
  const start = parseISO(entry.flareStartDate);
  const end = entry.flareEndDate ? parseISO(entry.flareEndDate) : new Date();
  const days = differenceInDays(end, start);
  if (days === 0) return "< 1 day";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function getActiveSymptomIds(entry: FlareEntry): string[] {
  return Object.keys(entry.symptoms).filter((k) => entry.symptoms[k]?.active);
}

interface TimelineProps {
  onSelectEntry: (id: string) => void;
}

export default function Timeline({ onSelectEntry }: TimelineProps) {
  const configMap = useMemo(() => getAllConfigsMap(), []);

  const [entries, setEntries] = useState(() =>
    getAllEntries().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const refreshEntries = useCallback(() => {
    setEntries(
      getAllEntries().sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  function handleMarkEnded(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    updateEntry(id, { flareEndDate: TODAY });
    refreshEntries();
  }

  function getLabel(id: string, cm: Map<string, SymptomConfig>): string {
    return cm.get(id)?.label ?? id;
  }

  function getEmoji(id: string, cm: Map<string, SymptomConfig>): string {
    return cm.get(id)?.emoji ?? "";
  }

  return (
    <div className="mx-auto max-w-lg pb-8">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Timeline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-600 dark:bg-gray-800">
          <p className="text-3xl">{"📋"}</p>
          <p className="mt-2 font-medium text-gray-500 dark:text-gray-400">No entries yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Log your first flare on the Quick Log tab
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const activeIds = getActiveSymptomIds(entry);
            const isOngoing = entry.flareEndDate === null;
            const firstLine = entry.notes
              ? entry.notes.split("\n")[0]!.slice(0, 80)
              : null;

            return (
              <div
                key={entry.id}
                className="rounded-xl border-2 border-gray-200 bg-white transition-colors hover:border-blue-300 hover:bg-blue-50/30 active:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/10 dark:active:bg-blue-900/20"
              >
                <button
                  type="button"
                  onClick={() => onSelectEntry(entry.id)}
                  className="w-full p-4 text-left"
                >
                  {/* Top row: dates + severity badge */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatDateShort(entry.flareStartDate)}
                        {" \u2192 "}
                        {entry.flareEndDate
                          ? formatDateShort(entry.flareEndDate)
                          : "Ongoing"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getDuration(entry)}
                        {isOngoing && " so far"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${severityBadge(entry.overallSeverity)}`}
                    >
                      {entry.overallSeverity}/10
                    </span>
                  </div>

                  {/* Active symptom pills */}
                  {activeIds.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {activeIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          title={getLabel(id, configMap)}
                        >
                          <span className="text-sm">
                            {getEmoji(id, configMap)}
                          </span>
                          {getLabel(id, configMap)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes preview */}
                  {firstLine && (
                    <p className="truncate text-sm text-gray-500 italic dark:text-gray-400">
                      {firstLine}
                      {entry.notes.length > 80 ? "..." : ""}
                    </p>
                  )}

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                {/* Mark Ended quick action for ongoing flares */}
                {isOngoing && (
                  <div className="border-t border-gray-100 px-4 py-2.5 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={(e) => handleMarkEnded(e, entry.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 active:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
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
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Mark Ended Today
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
