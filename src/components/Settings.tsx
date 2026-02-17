import { useState, useRef } from "react";
import type { AppSettings } from "../services/settings";
import { downloadFullBackup, importFullBackup } from "../services/backupService";
import type { ImportResult } from "../services/backupService";
import SymptomManager from "./SymptomManager";
import TagManager from "./TagManager";

type SubView = null | "symptoms" | "tags";

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onBack: () => void;
}

export default function Settings({ settings, onUpdate, onBack }: SettingsProps) {
  const [subView, setSubView] = useState<SubView>(null);
  const [backupResult, setBackupResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggle(key: keyof AppSettings) {
    onUpdate({ ...settings, [key]: !settings[key] });
  }

  async function handleRemindersToggle() {
    if (!settings.remindersEnabled) {
      if (!("Notification" in window)) {
        alert("Your browser does not support notifications.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission was denied. Please enable it in your browser settings.");
        return;
      }
    }
    toggle("remindersEnabled");
  }

  function handleExportBackup() {
    downloadFullBackup();
    setBackupResult("Backup file downloaded.");
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
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
        setBackupResult(`Imported: ${parts.join(", ")}. Reload to see all changes.`);
      } catch (err) {
        setBackupResult(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Sub-views
  if (subView === "symptoms") {
    return <SymptomManager onBack={() => setSubView(null)} />;
  }
  if (subView === "tags") {
    return <TagManager onBack={() => setSubView(null)} />;
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      {/* Manage Symptoms */}
      <button
        type="button"
        onClick={() => setSubView("symptoms")}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-lg dark:bg-blue-900/30">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Manage Symptoms</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Add, reorder, edit, or archive symptoms</p>
        </div>
        <span className="text-gray-400 dark:text-gray-500">{"\u203A"}</span>
      </button>

      {/* Edit Tags */}
      <button
        type="button"
        onClick={() => setSubView("tags")}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-lg dark:bg-purple-900/30">
          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Edit Default Tags</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Customize the quick-select tag list</p>
        </div>
        <span className="text-gray-400 dark:text-gray-500">{"\u203A"}</span>
      </button>

      {/* Dark Mode */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Dark Mode</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Easier on the eyes at night</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => toggle("darkMode")}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full dark:bg-gray-600" />
          </label>
        </div>
      </div>

      {/* Daily Reminders */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Daily Reminders</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Get a browser notification to log symptoms
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.remindersEnabled}
              onChange={handleRemindersToggle}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full dark:bg-gray-600" />
          </label>
        </div>

        {settings.remindersEnabled && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
            <label
              htmlFor="reminder-time"
              className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Reminder Time
            </label>
            <input
              id="reminder-time"
              type="time"
              value={settings.reminderTime}
              onChange={(e) =>
                onUpdate({ ...settings, reminderTime: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Notifications work while the app tab is open
            </p>
          </div>
        )}
      </div>

      {/* Backup & Restore */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Backup & Restore
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Full backup includes entries, symptom configs, tags, and settings
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700 active:scale-[0.98] dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-800 bg-white py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 active:scale-[0.98] dark:border-gray-500 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        {backupResult && (
          <p className={`mt-3 text-center text-xs font-medium ${
            backupResult.startsWith("Import failed")
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400"
          }`}>
            {backupResult}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">About</h2>
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <p>All data is stored locally in your browser.</p>
          <p>No accounts, no servers, no data leaves your device.</p>
        </div>
      </div>
    </div>
  );
}
