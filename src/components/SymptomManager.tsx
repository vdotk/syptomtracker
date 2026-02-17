import { useState } from "react";
import type { SymptomInputType, SymptomConfig } from "../services/symptomConfig";
import {
  getSymptomConfigs,
  getActiveConfigs,
  addCustomSymptom,
  updateSymptomConfig,
  archiveSymptom,
  unarchiveSymptom,
  reorderSymptom,
} from "../services/symptomConfig";

const INPUT_TYPE_LABELS: Record<SymptomInputType, string> = {
  slider: "Severity 0-10",
  enum: "Mild/Mod/Severe",
  toggle: "On/Off Only",
  temperature: "Temperature",
};

const INPUT_TYPE_OPTIONS: { value: SymptomInputType; label: string }[] = [
  { value: "slider", label: "Severity slider (0-10)" },
  { value: "toggle", label: "Toggle (on/off only)" },
  { value: "enum", label: "Mild / Moderate / Severe" },
  { value: "temperature", label: "Temperature (\u00B0F)" },
];

interface SymptomManagerProps {
  onBack: () => void;
}

export default function SymptomManager({ onBack }: SymptomManagerProps) {
  const [activeConfigs, setActiveConfigs] = useState(() => getActiveConfigs());
  const [archivedConfigs, setArchivedConfigs] = useState(() =>
    getSymptomConfigs().filter((c) => c.archived),
  );
  const [showArchived, setShowArchived] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newInputType, setNewInputType] = useState<SymptomInputType>("slider");
  const [newImageLinks, setNewImageLinks] = useState(false);

  // Edit form state
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editInputType, setEditInputType] = useState<SymptomInputType>("slider");
  const [editImageLinks, setEditImageLinks] = useState(false);

  function refresh() {
    setActiveConfigs(getActiveConfigs());
    setArchivedConfigs(getSymptomConfigs().filter((c) => c.archived));
  }

  function handleAdd() {
    if (!newLabel.trim()) return;
    addCustomSymptom(
      newLabel.trim(),
      newEmoji.trim() || "\u2B50",
      newInputType,
      newImageLinks,
    );
    setNewLabel("");
    setNewEmoji("");
    setNewInputType("slider");
    setNewImageLinks(false);
    setShowAddForm(false);
    refresh();
  }

  function handleMoveUp(id: string) {
    reorderSymptom(id, "up");
    refresh();
  }

  function handleMoveDown(id: string) {
    reorderSymptom(id, "down");
    refresh();
  }

  function handleArchive(id: string) {
    archiveSymptom(id);
    refresh();
  }

  function handleUnarchive(id: string) {
    unarchiveSymptom(id);
    refresh();
  }

  function startEdit(config: SymptomConfig) {
    setEditingId(config.id);
    setEditLabel(config.label);
    setEditEmoji(config.emoji);
    setEditInputType(config.inputType);
    setEditImageLinks(config.supportsImageLinks);
  }

  function handleSaveEdit() {
    if (!editingId || !editLabel.trim()) return;
    updateSymptomConfig(editingId, {
      label: editLabel.trim(),
      emoji: editEmoji.trim() || "\u2B50",
      inputType: editInputType,
      supportsImageLinks: editImageLinks,
    });
    setEditingId(null);
    refresh();
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

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
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage Symptoms</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Add, reorder, or archive symptoms
          </p>
        </div>
      </div>

      {/* Active symptoms list */}
      <div className="space-y-2">
        {activeConfigs.map((config, idx) => (
          <div key={config.id}>
            {editingId === config.id ? (
              /* Editing mode */
              <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-900/20">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      placeholder="\u2B50"
                      className="w-14 rounded-lg border border-gray-300 px-2 py-2 text-center text-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Symptom name"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <select
                    value={editInputType}
                    onChange={(e) => setEditInputType(e.target.value as SymptomInputType)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {INPUT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={editImageLinks}
                      onChange={(e) => setEditImageLinks(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    Supports image links
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Display mode */
              <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                {/* Reorder buttons */}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(config.id)}
                    disabled={idx === 0}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-20 dark:hover:bg-gray-700"
                    aria-label="Move up"
                  >
                    {"\u25B2"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(config.id)}
                    disabled={idx === activeConfigs.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-20 dark:hover:bg-gray-700"
                    aria-label="Move down"
                  >
                    {"\u25BC"}
                  </button>
                </div>

                {/* Emoji + Label */}
                <span className="text-xl">{config.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {INPUT_TYPE_LABELS[config.inputType]}
                    {config.isBuiltIn ? "" : " \u00B7 Custom"}
                  </p>
                </div>

                {/* Actions */}
                <button
                  type="button"
                  onClick={() => startEdit(config)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Edit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleArchive(config.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
                  aria-label="Archive"
                  title="Archive"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add custom symptom */}
      {showAddForm ? (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
          <h3 className="mb-3 text-sm font-semibold text-green-800 dark:text-green-300">
            New Custom Symptom
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="\u2B50"
                className="w-14 rounded-lg border border-gray-300 px-2 py-2 text-center text-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Symptom name"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <select
              value={newInputType}
              onChange={(e) => setNewInputType(e.target.value as SymptomInputType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              {INPUT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={newImageLinks}
                onChange={(e) => setNewImageLinks(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Supports image links
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-40"
              >
                Add Symptom
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
        >
          <span className="text-lg">+</span>
          Add Custom Symptom
        </button>
      )}

      {/* Archived symptoms */}
      {archivedConfigs.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <span>Archived ({archivedConfigs.length})</span>
            <span>{showArchived ? "\u25B2" : "\u25BC"}</span>
          </button>

          {showArchived && (
            <div className="mt-2 space-y-2">
              {archivedConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <span className="text-xl opacity-50">{config.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {INPUT_TYPE_LABELS[config.inputType]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnarchive(config.id)}
                    className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
