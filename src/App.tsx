import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import type { FlareEntry } from "./types";
import { restoreEntry } from "./services/flareStorage";
import { getSettings, saveSettings, getLastReminderDate, setLastReminderDate } from "./services/settings";
import { migrateIfNeeded } from "./services/symptomConfig";

// Ensure symptom config exists in localStorage before any component reads it
migrateIfNeeded();
import type { AppSettings } from "./services/settings";
import QuickLog from "./components/QuickLog";
import Timeline from "./components/Timeline";
import EntryDetail from "./components/EntryDetail";
import Dashboard from "./components/Dashboard";
import ExportTools from "./components/ExportTools";
import Settings from "./components/Settings";
import NavBar from "./components/NavBar";
import UndoToast from "./components/UndoToast";

type View = "quicklog" | "timeline" | "dashboard" | "export";

function App() {
  const [view, setView] = useState<View>("quicklog");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [deletedEntry, setDeletedEntry] = useState<FlareEntry | null>(null);
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply dark mode class
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  // Daily reminder notifications
  useEffect(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }

    if (!settings.remindersEnabled) return;

    function checkReminder() {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      const today = format(now, "yyyy-MM-dd");
      const lastReminder = getLastReminderDate();

      if (lastReminder === today) return;
      if (currentTime < settings.reminderTime) return;

      if (Notification.permission === "granted") {
        new Notification("Symptom Tracker", {
          body: "Time to log your symptoms for today",
          icon: "/favicon.ico",
        });
        setLastReminderDate(today);
      }
    }

    // Check immediately, then every 60 seconds
    checkReminder();
    reminderIntervalRef.current = setInterval(checkReminder, 60_000);

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [settings.remindersEnabled, settings.reminderTime]);

  function handleUpdateSettings(updated: AppSettings) {
    setSettings(updated);
    saveSettings(updated);
  }

  function openDetail(id: string) {
    setDetailId(id);
  }

  function closeDetail() {
    setDetailId(null);
  }

  const handleDeleted = useCallback((entry: FlareEntry) => {
    setDetailId(null);
    setDeletedEntry(entry);
  }, []);

  function handleUndo() {
    if (deletedEntry) {
      restoreEntry(deletedEntry);
      setDeletedEntry(null);
    }
  }

  function handleUndoExpire() {
    setDeletedEntry(null);
  }

  let content;
  if (showSettings) {
    content = (
      <Settings
        settings={settings}
        onUpdate={handleUpdateSettings}
        onBack={() => setShowSettings(false)}
      />
    );
  } else if (detailId) {
    content = (
      <EntryDetail
        entryId={detailId}
        onBack={closeDetail}
        onDeleted={handleDeleted}
      />
    );
  } else {
    switch (view) {
      case "quicklog":
        content = <QuickLog />;
        break;
      case "timeline":
        content = <Timeline onSelectEntry={openDetail} />;
        break;
      case "dashboard":
        content = <Dashboard />;
        break;
      case "export":
        content = <ExportTools />;
        break;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-6 pb-20 dark:bg-gray-900">
      {/* Settings gear icon */}
      {!showSettings && !detailId && (
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="fixed top-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Settings"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {content}

      {!detailId && !showSettings && <NavBar active={view} onChange={setView} />}

      {/* Undo delete toast */}
      {deletedEntry && (
        <UndoToast
          message="Entry deleted"
          durationMs={10_000}
          onUndo={handleUndo}
          onExpire={handleUndoExpire}
        />
      )}
    </div>
  );
}

export default App;
