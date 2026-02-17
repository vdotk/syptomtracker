import { useState } from "react";
import { getPresetTags, savePresetTags, addPresetTag, removePresetTag } from "../services/tagConfig";

interface TagManagerProps {
  onBack: () => void;
}

export default function TagManager({ onBack }: TagManagerProps) {
  const [tags, setTags] = useState(() => getPresetTags());
  const [newTag, setNewTag] = useState("");

  function refresh() {
    setTags(getPresetTags());
  }

  function handleAdd() {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    addPresetTag(trimmed);
    setNewTag("");
    refresh();
  }

  function handleRemove(tag: string) {
    removePresetTag(tag);
    refresh();
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...tags];
    [updated[index - 1], updated[index]] = [updated[index]!, updated[index - 1]!];
    savePresetTags(updated);
    refresh();
  }

  function handleMoveDown(index: number) {
    if (index >= tags.length - 1) return;
    const updated = [...tags];
    [updated[index], updated[index + 1]] = [updated[index + 1]!, updated[index]!];
    savePresetTags(updated);
    refresh();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Default Tags</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            These tags appear as quick-select options when logging
          </p>
        </div>
      </div>

      {/* Tag list */}
      <div className="space-y-2">
        {tags.map((tag, idx) => (
          <div
            key={tag}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Reorder buttons */}
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => handleMoveUp(idx)}
                disabled={idx === 0}
                className="flex h-5 w-5 items-center justify-center rounded text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-20 dark:hover:bg-gray-700"
                aria-label="Move up"
              >
                {"\u25B2"}
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(idx)}
                disabled={idx === tags.length - 1}
                className="flex h-5 w-5 items-center justify-center rounded text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-20 dark:hover:bg-gray-700"
                aria-label="Move down"
              >
                {"\u25BC"}
              </button>
            </div>

            <span className="min-w-0 flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {tag}
            </span>

            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              aria-label={`Remove ${tag}`}
            >
              {"\u2715"}
            </button>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-8 text-center dark:border-gray-600 dark:bg-gray-800">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No preset tags. Add one below.
            </p>
          </div>
        )}
      </div>

      {/* Add tag */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a preset tag..."
          className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTag.trim()}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
