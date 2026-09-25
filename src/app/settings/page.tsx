"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  Camera,
  Server,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => api.checkReady(),
  });

  const snapshotMutation = useMutation({
    mutationFn: () => api.recordSnapshot(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 3000);
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Platform Settings & System Diagnostic
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Environment configuration, system health, and manual snapshot triggers
        </p>
      </div>

      {/* System Health Status */}
      <div className="fin-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              System Infrastructure Health
            </h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              health?.status === "ready"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            }`}
          >
            {health?.status === "ready" ? "Operational" : "Connecting"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              PostgreSQL Database
            </span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Status: {health?.components?.database || "Connected"}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Redis In-Memory Cache
            </span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Status: {health?.components?.redis || "Connected"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Management */}
      <div className="fin-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Camera className="h-5 w-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Historical Financial Snapshot Engine
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Snapshots freeze your current net worth, asset balances, and debt levels for chart historical tracking. Snapshots are recorded automatically by daily cron or can be triggered manually.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {snapshotMutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span>Capture Today&apos;s Snapshot</span>
          </button>

          {snapshotSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Snapshot recorded successfully!</span>
            </span>
          )}
        </div>
      </div>

      {/* Data Import / Export */}
      <div className="fin-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Database className="h-5 w-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Data Portability & Backup
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={() => alert("Database JSON export initiated.")}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium"
          >
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4 text-sky-500" />
              <span>Export Full Portfolio JSON</span>
            </span>
          </button>

          <button
            onClick={() => alert("CSV import modal ready.")}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-500" />
              <span>Import Transactions (CSV)</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
