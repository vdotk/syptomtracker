import { useState, useEffect } from "react";

interface UndoToastProps {
  message: string;
  durationMs: number;
  onUndo: () => void;
  onExpire: () => void;
}

export default function UndoToast({ message, durationMs, onUndo, onExpire }: UndoToastProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 100);

    const timeout = setTimeout(() => {
      onExpire();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [durationMs, onExpire]);

  const progress = remaining / durationMs;

  return (
    <div className="fixed right-4 bottom-20 left-4 z-[100] mx-auto max-w-lg">
      <div className="overflow-hidden rounded-xl border-2 border-gray-300 bg-gray-800 shadow-lg dark:border-gray-600 dark:bg-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-white">{message}</span>
          <button
            type="button"
            onClick={onUndo}
            className="ml-4 shrink-0 rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-400 active:bg-blue-600"
          >
            Undo
          </button>
        </div>
        <div
          className="h-1 bg-blue-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
