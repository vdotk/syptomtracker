import { useState } from "react";

interface TagsInputProps {
  tags: string[];
  presetTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagsInput({ tags, presetTags, onChange }: TagsInputProps) {
  const [customInput, setCustomInput] = useState("");

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      onChange(tags.filter((t) => t !== tag));
    } else {
      onChange([...tags, tag]);
    }
  }

  function addCustomTag() {
    const trimmed = customInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setCustomInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  // Custom tags are those not in the preset list
  const customTags = tags.filter((t) => !presetTags.includes(t));

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        Tags
      </label>

      {/* Preset tags */}
      <div className="mb-3 flex flex-wrap gap-2">
        {presetTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              tags.includes(tag)
                ? "border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-gray-300 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Custom tags display */}
      {customTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 text-purple-400 hover:text-purple-700 dark:text-purple-500 dark:hover:text-purple-300"
                aria-label={`Remove ${tag}`}
              >
                {"\u2715"}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom tag..."
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <button
          type="button"
          onClick={addCustomTag}
          disabled={!customInput.trim()}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}
