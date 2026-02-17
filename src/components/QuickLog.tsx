import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import type { SymptomData, FlareEntry } from "../types";
import { createEntry, createDefaultSymptoms, getLastEntry } from "../services/flareStorage";
import { getActiveConfigs, defaultSeverityForConfig } from "../services/symptomConfig";
import { getPresetTags } from "../services/tagConfig";
import SymptomCard from "./SymptomCard";
import OverallSeverity from "./OverallSeverity";
import TagsInput from "./TagsInput";

const TODAY = format(new Date(), "yyyy-MM-dd");
const YESTERDAY = format(subDays(new Date(), 1), "yyyy-MM-dd");

function buildInitialState() {
  return {
    flareStartDate: TODAY,
    flareEndDate: null as string | null,
    ongoing: true,
    symptoms: createDefaultSymptoms(),
    overallSeverity: 1,
    notes: "",
    tags: [] as string[],
  };
}

function entryToFormState(entry: FlareEntry) {
  return {
    flareStartDate: TODAY,
    flareEndDate: null as string | null,
    ongoing: true,
    symptoms: JSON.parse(JSON.stringify(entry.symptoms)),
    overallSeverity: entry.overallSeverity,
    notes: "",
    tags: [...entry.tags],
  };
}

function wasLoggedYesterday(entry: FlareEntry | undefined): boolean {
  if (!entry) return false;
  return entry.flareStartDate === YESTERDAY || entry.flareStartDate === TODAY;
}

export default function QuickLog() {
  const lastEntry = useMemo(() => getLastEntry(), []);
  const hasYesterdayEntry = wasLoggedYesterday(lastEntry);
  const configs = useMemo(() => getActiveConfigs(), []);
  const presetTags = useMemo(() => getPresetTags(), []);

  const [form, setForm] = useState(buildInitialState);
  const [saved, setSaved] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(hasYesterdayEntry);

  function handleSymptomChange(id: string, data: SymptomData) {
    setForm((prev) => {
      const symptoms = { ...prev.symptoms, [id]: data };
      return { ...prev, symptoms };
    });
  }

  function handleDuplicate() {
    if (!lastEntry) return;
    setForm(entryToFormState(lastEntry));
    setShowSuggestion(false);
  }

  function handleSave() {
    createEntry({
      flareStartDate: form.flareStartDate,
      flareEndDate: form.ongoing ? null : form.flareEndDate,
      symptoms: form.symptoms,
      overallSeverity: form.overallSeverity,
      notes: form.notes,
      tags: form.tags,
    });
    setSaved(true);
    setShowSuggestion(false);
    setTimeout(() => {
      setSaved(false);
      setForm(buildInitialState());
    }, 1500);
  }

  const activeCount = configs.filter(
    (c) => form.symptoms[c.id]?.active,
  ).length;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quick Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tap symptoms to log, then save
        </p>
      </div>

      {/* Smart suggestion banner */}
      {showSuggestion && lastEntry && (
        <button
          type="button"
          onClick={handleDuplicate}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:bg-blue-100 active:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg dark:bg-blue-800">
            {"\u21BB"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Same as yesterday?
            </p>
            <p className="truncate text-xs text-blue-600 dark:text-blue-400">
              Tap to pre-fill with your last entry's symptoms
            </p>
          </div>
          <span className="text-xs text-blue-400 dark:text-blue-500">{"\u2192"}</span>
        </button>
      )}

      {/* Duplicate last entry button */}
      {lastEntry && !showSuggestion && (
        <button
          type="button"
          onClick={handleDuplicate}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        >
          <span>{"\u21BB"}</span>
          Duplicate Last Entry
        </button>
      )}

      {/* Date fields */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="flare-start"
              className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Flare Start Date
            </label>
            <input
              id="flare-start"
              type="date"
              value={form.flareStartDate}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  flareStartDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.ongoing}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ongoing: e.target.checked,
                    flareEndDate: e.target.checked ? null : TODAY,
                  }))
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full dark:bg-gray-600" />
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Still ongoing
            </span>
          </div>

          {!form.ongoing && (
            <div>
              <label
                htmlFor="flare-end"
                className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Flare End Date
              </label>
              <input
                id="flare-end"
                type="date"
                value={form.flareEndDate ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    flareEndDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Symptoms</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="space-y-2">
          {configs.map((config) => (
            <SymptomCard
              key={config.id}
              symptomId={config.id}
              config={config}
              data={form.symptoms[config.id] ?? { active: false, severity: defaultSeverityForConfig(config) }}
              onChange={handleSymptomChange}
            />
          ))}
        </div>
      </div>

      {/* Overall severity */}
      <OverallSeverity
        value={form.overallSeverity}
        onChange={(v) =>
          setForm((prev) => ({ ...prev, overallSeverity: v }))
        }
      />

      {/* Notes */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="How are you feeling? Any triggers or observations..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
        />
      </div>

      {/* Tags */}
      <TagsInput
        tags={form.tags}
        presetTags={presetTags}
        onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
      />

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saved}
        className={`w-full rounded-xl py-4 text-lg font-bold shadow-sm transition-all ${
          saved
            ? "bg-green-500 text-white"
            : "bg-blue-600 text-white active:scale-[0.98] hover:bg-blue-700"
        }`}
      >
        {saved ? "\u2713 Saved!" : "Save Entry"}
      </button>
    </div>
  );
}
