"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message: string, title?: string, duration?: number) =>
        showToast("success", message, title, duration),
      error: (message: string, title?: string, duration?: number) =>
        showToast("error", message, title, duration),
      warning: (message: string, title?: string, duration?: number) =>
        showToast("warning", message, title, duration),
      info: (message: string, title?: string, duration?: number) =>
        showToast("info", message, title, duration),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      {/* Toast Container */}
      <div
        dir="rtl"
        aria-live="polite"
        className="fixed bottom-5 left-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const styles = {
    success: {
      container:
        "border-emerald-500/40 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-50 shadow-emerald-500/10",
      iconBox:
        "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50",
      title: "text-emerald-900 dark:text-emerald-100",
      message: "text-emerald-800 dark:text-emerald-200",
      icon: CheckCircle2,
    },
    error: {
      container:
        "border-rose-500/40 bg-rose-50/95 dark:bg-rose-950/90 text-rose-950 dark:text-rose-50 shadow-rose-500/10",
      iconBox:
        "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700/50",
      title: "text-rose-900 dark:text-rose-100",
      message: "text-rose-800 dark:text-rose-200",
      icon: AlertCircle,
    },
    warning: {
      container:
        "border-amber-500/40 bg-amber-50/95 dark:bg-amber-950/90 text-amber-950 dark:text-amber-50 shadow-amber-500/10",
      iconBox:
        "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50",
      title: "text-amber-900 dark:text-amber-100",
      message: "text-amber-800 dark:text-amber-200",
      icon: AlertTriangle,
    },
    info: {
      container:
        "border-sky-500/40 bg-sky-50/95 dark:bg-sky-950/90 text-sky-950 dark:text-sky-50 shadow-sky-500/10",
      iconBox:
        "bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-700/50",
      title: "text-sky-900 dark:text-sky-100",
      message: "text-sky-800 dark:text-sky-200",
      icon: Info,
    },
  }[item.type];

  const IconComponent = styles.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${styles.container}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${styles.iconBox}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {item.title && (
            <h4 className={`text-xs font-bold leading-none mb-1 ${styles.title}`}>
              {item.title}
            </h4>
          )}
          <p className={`text-xs leading-relaxed font-medium ${styles.message}`}>
            {item.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
          aria-label="بستن اعلان"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
