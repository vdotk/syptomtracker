import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { SymptomData, FlareEntry } from "../types";
import {
  getEntryById,
  updateEntry,
  deleteEntry,
  createDefaultSymptoms,
} from "../services/flareStorage";
import { getActiveConfigs, getAllConfigsMap, defaultSeverityForConfig } from "../services/symptomConfig";
import type { SymptomConfig } from "../services/symptomConfig";
import { getPresetTags } from "../services/tagConfig";
import SymptomCard from "./SymptomCard";
import OverallSeverity from "./OverallSeverity";
import TagsInput from "./TagsInput";

const TODAY = format(new Date(), "yyyy-MM-dd");

interface EntryDetailProps {
  entryId: string;
  onBack: () => void;
  onDeleted: (deletedEntry: FlareEntry) => void;
}

function entryToForm(entry: FlareEntry) {
  return {
    flareStartDate: entry.flareStartDate,
    flareEndDate: entry.flareEndDate,
    ongoing: entry.flareEndDate === null,
    symptoms: { ...entry.symptoms },
    overallSeverity: entry.overallSeverity,
    notes: entry.notes,
    tags: [...entry.tags],
  };
}

export default function EntryDetail({
  entryId,
  onBack,
  onDeleted,
}: EntryDetailProps) {
  const entry = getEntryById(entryId);
  const activeConfigs = useMemo(() => getActiveConfigs(), []);
  const configMap = useMemo(() => getAllConfigsMap(), []);
  const presetTags = useMemo(() => getPresetTags(), []);

  // Build the list of configs to display: active configs + any extra symptom keys
  // from this entry that aren't in active configs (e.g., archived symptoms that were logged)
  const displayConfigs = useMemo(() => {
    if (!entry) return activeConfigs;
    const activeIds = new Set(activeConfigs.map((c) => c.id));
    const extraConfigs: SymptomConfig[] = [];
    for (const key of Object.keys(entry.symptoms)) {
      if (!activeIds.has(key) && entry.symptoms[key]?.active) {
        const config = configMap.get(key);
        if (config) {
          extraConfigs.push(config);
        } else {
          // No config at all — create a fallback for display
          extraConfigs.push({
            id: key,
            label: key,
            emoji: "",
            inputType: "slider",
            supportsImageLinks: false,
            archived: true,
            order: 9999,
            isBuiltIn: false,
          });
        }
      }
    }
    return [...activeConfigs, ...extraConfigs];
  }, [entry, activeConfigs, configMap]);

  const [form, setForm] = useState(() =>
    entry
      ? entryToForm(entry)
      : {
          flareStartDate: TODAY,
          flareEndDate: null as string | null,
          ongoing: true,
          symptoms: createDefaultSymptoms(),
          overallSeverity: 1,
          notes: "",
          tags: [] as string[],
        },
  );
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!entry) {
    return (
      <div className="mx-auto max-w-lg pb-8 text-center">
        <p className="py-12 text-gray-500 dark:text-gray-400">Entry not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Timeline
        </button>
      </div>
    );
  }

  function handleSymptomChange(id: string, data: SymptomData) {
    setForm((prev) => {
      const symptoms = { ...prev.symptoms, [id]: data };
      return { ...prev, symptoms };
    });
  }

  function handleSave() {
    updateEntry(entryId, {
      flareStartDate: form.flareStartDate,
      flareEndDate: form.ongoing ? null : form.flareEndDate,
      symptoms: form.symptoms,
      overallSeverity: form.overallSeverity,
      notes: form.notes,
      tags: form.tags,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleDelete() {
    deleteEntry(entryId);
    onDeleted(entry!);
  }

  const activeCount = displayConfigs.filter(
    (c) => form.symptoms[c.id]?.active,
  ).length;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Back"
        >
          {"\u2190"}
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Entry</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Created {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
          </p>
        </div>
      </div>

      {/* Date fields */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="detail-flare-start"
              className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Flare Start Date
            </label>
            <input
              id="detail-flare-start"
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
                htmlFor="detail-flare-end"
                className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Flare End Date
              </label>
              <input
                id="detail-flare-end"
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
          {displayConfigs.map((config) => (
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
          htmlFor="detail-notes"
          className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          Notes
        </label>
        <textarea
          id="detail-notes"
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

      {/* Action buttons */}
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
        {saved ? "\u2713 Saved!" : "Save Changes"}
      </button>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="w-full rounded-xl border-2 border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete Entry
        </button>
      ) : (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="mb-3 text-center text-sm font-medium text-red-700 dark:text-red-400">
            Delete this entry? You'll have 10 seconds to undo.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
