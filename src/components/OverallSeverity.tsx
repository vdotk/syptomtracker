interface OverallSeverityProps {
  value: number;
  onChange: (value: number) => void;
}

function severityColor(value: number): string {
  if (value <= 2) return "text-green-600";
  if (value <= 4) return "text-yellow-500";
  if (value <= 6) return "text-orange-500";
  if (value <= 8) return "text-red-500";
  return "text-red-700";
}

export default function OverallSeverity({
  value,
  onChange,
}: OverallSeverityProps) {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Overall Severity
        </label>
        <span className={`text-2xl font-bold ${severityColor(value)}`}>
          {value}/10
        </span>
      </div>
      <div className="relative">
        <div className="severity-track absolute top-1/2 right-0 left-0 h-2 -translate-y-1/2 rounded-full" />
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="overall-severity-slider relative z-10 w-full"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>Mild</span>
        <span>Severe</span>
      </div>
    </div>
  );
}
