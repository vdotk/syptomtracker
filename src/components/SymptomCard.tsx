import type { SymptomData, Severity } from "../types";
import type { SymptomConfig } from "../services/symptomConfig";

const SEVERITY_OPTIONS: Severity[] = ["mild", "moderate", "severe"];
const SEVERITY_COLORS: Record<Severity, string> = {
  mild: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  moderate: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  severe: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};
const SEVERITY_COLORS_ACTIVE: Record<Severity, string> = {
  mild: "bg-yellow-400 text-yellow-900 border-yellow-500",
  moderate: "bg-orange-400 text-orange-900 border-orange-500",
  severe: "bg-red-400 text-red-900 border-red-500",
};

const MAX_IMAGE_LINKS = 3;

interface SymptomCardProps {
  symptomId: string;
  config: SymptomConfig;
  data: SymptomData;
  onChange: (id: string, data: SymptomData) => void;
}

export default function SymptomCard({
  symptomId,
  config,
  data,
  onChange,
}: SymptomCardProps) {
  const imageLinks = data.imageLinks ?? [];
  const visibleLinkCount = imageLinks.length;

  function toggle() {
    onChange(symptomId, { ...data, active: !data.active });
  }

  function setSeverity(severity: number | Severity) {
    onChange(symptomId, { ...data, severity });
  }

  function setNotes(notes: string) {
    onChange(symptomId, { ...data, notes: notes || undefined });
  }

  function addImageLinkSlot() {
    if (visibleLinkCount >= MAX_IMAGE_LINKS) return;
    onChange(symptomId, {
      ...data,
      imageLinks: [...imageLinks, ""],
    });
  }

  function updateImageLink(index: number, url: string) {
    const updated = [...imageLinks];
    updated[index] = url;
    onChange(symptomId, { ...data, imageLinks: updated });
  }

  function removeImageLink(index: number) {
    const updated = imageLinks.filter((_, i) => i !== index);
    onChange(symptomId, {
      ...data,
      imageLinks: updated.length > 0 ? updated : undefined,
    });
  }

  function renderSeverityControl() {
    switch (config.inputType) {
      case "toggle":
        // No severity control for toggle-only symptoms
        return null;

      case "enum":
        return (
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
              Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`rounded-lg border-2 px-3 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    data.severity === level
                      ? SEVERITY_COLORS_ACTIVE[level]
                      : SEVERITY_COLORS[level]
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );

      case "temperature":
        return (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Temperature
              </label>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.severity as number}°F
              </span>
            </div>
            <input
              type="number"
              min={90}
              max={115}
              step={0.1}
              value={data.severity as number}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        );

      case "slider":
      default:
        return (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Severity
              </label>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.severity as number}/10
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={data.severity as number}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="severity-slider w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>None</span>
              <span>Worst</span>
            </div>
          </div>
        );
    }
  }

  return (
    <div
      className={`rounded-xl border-2 transition-colors ${
        data.active
          ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      {/* Toggle header */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl" role="img" aria-label={config.label}>
          {config.emoji}
        </span>
        <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            data.active
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-500"
          }`}
        >
          {data.active ? "\u{2713}" : ""}
        </span>
      </button>

      {/* Expanded controls */}
      {data.active && (
        <div className="space-y-3 border-t border-blue-200 px-4 pb-4 pt-3 dark:border-blue-700">
          {renderSeverityControl()}

          {/* Image link inputs */}
          {config.supportsImageLinks && (
            <div>
              {imageLinks.map((link, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateImageLink(i, e.target.value)}
                    placeholder="Paste image URL..."
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageLink(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    aria-label="Remove link"
                  >
                    {"\u2715"}
                  </button>
                </div>
              ))}
              {visibleLinkCount < MAX_IMAGE_LINKS && (
                <button
                  type="button"
                  onClick={addImageLinkSlot}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  <span role="img" aria-label="camera">{"\uD83D\uDCF7"}</span>
                  Add photo link
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <input
            type="text"
            value={data.notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
          />
        </div>
      )}
    </div>
  );
}
