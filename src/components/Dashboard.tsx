import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { getAllEntries } from "../services/flareStorage";
import {
  filterByPeriod,
  computeCurrentStatus,
  computeSeverityTimeline,
  computeSymptomFrequency,
  computeCorrelations,
  TIME_PERIOD_LABELS,
} from "../services/stats";
import type { TimePeriod } from "../services/stats";

const PERIODS: TimePeriod[] = ["30d", "90d", "6m", "1y", "all"];

const BAR_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
];

function severityDotColor(severity: number): string {
  if (severity <= 3) return "#22c55e";
  if (severity <= 5) return "#eab308";
  if (severity <= 7) return "#f97316";
  return "#ef4444";
}

function severityBadgeClass(severity: number): string {
  if (severity <= 3) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (severity <= 5) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (severity <= 7) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function Dashboard() {
  const [period, setPeriod] = useState<TimePeriod>("90d");
  const allEntries = useMemo(() => getAllEntries(), []);
  const entries = useMemo(
    () => filterByPeriod(allEntries, period),
    [allEntries, period],
  );

  const status = useMemo(
    () => computeCurrentStatus(allEntries),
    [allEntries],
  );
  const severityData = useMemo(
    () => computeSeverityTimeline(entries),
    [entries],
  );
  const freqData = useMemo(
    () => computeSymptomFrequency(entries),
    [entries],
  );
  const correlations = useMemo(
    () => computeCorrelations(entries),
    [entries],
  );

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border-2 border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              period === p
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {TIME_PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Current Status */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Current Status
        </h2>
        {status.totalEntries === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
            No data yet. Log your first flare to see stats.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-gray-700">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {status.daysSinceLastFlare ?? "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                days since
                <br />
                last flare
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-gray-700">
              <p
                className={`text-2xl font-bold ${status.isOngoing ? "text-red-600" : "text-green-600"}`}
              >
                {status.isOngoing ? "Yes" : "No"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                flare
                <br />
                ongoing
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-gray-700">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {status.avgDurationDays ?? "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                avg days
                <br />
                per flare
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Severity Over Time */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Severity Over Time
        </h2>
        {severityData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No entries in this period
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={severityData}
              margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  padding: "8px 12px",
                }}
                formatter={(value: number | undefined) => [
                  `${value ?? 0}/10`,
                  "Severity",
                ]}
              />
              <Line
                type="monotone"
                dataKey="severity"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={(props: Record<string, unknown>) => {
                  const { cx, cy, payload } = props as {
                    cx: number;
                    cy: number;
                    payload: { severity: number };
                  };
                  return (
                    <circle
                      key={`${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={severityDotColor(payload.severity)}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 8, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Symptom Frequency */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Symptom Frequency
        </h2>
        {freqData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No symptoms logged in this period
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(200, freqData.length * 40)}>
              <BarChart
                data={freqData}
                layout="vertical"
                margin={{ top: 0, right: 5, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                    padding: "8px 12px",
                  }}
                  formatter={(value: number | undefined) => [
                    `${value ?? 0} ${value === 1 ? "time" : "times"}`,
                    "Logged",
                  ]}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                  {freqData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS[i % BAR_COLORS.length]!}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Symptom Correlations */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Symptom Correlations
        </h2>
        <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
          Symptoms that tend to appear together
        </p>
        {correlations.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
            Need more entries with multiple symptoms
          </p>
        ) : (
          <div className="space-y-2">
            {correlations.map((pair, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-gray-700"
              >
                <span className="text-lg font-bold text-gray-300 dark:text-gray-500">
                  {i + 1}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-600 dark:text-gray-200">
                    {pair.emojiA} {pair.symptomA}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-600 dark:text-gray-200">
                    {pair.emojiB} {pair.symptomB}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${severityBadgeClass(Math.ceil((pair.percentage / 100) * 10))}`}
                  >
                    {pair.count}x
                  </span>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {pair.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
