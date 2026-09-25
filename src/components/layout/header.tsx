"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Plus, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenQuickTx?: () => void;
}

const emptySubscribe = () => () => {};

export function Header({ title = "Overview", subtitle, onOpenQuickTx }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh Data */}
        <button
          onClick={handleRefresh}
          title="Refresh Financial Data"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-sky-500" : ""}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle Theme"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors w-8 h-8 flex items-center justify-center"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4 block" />
          )}
        </button>

        {/* New Transaction Button */}
        {onOpenQuickTx && (
          <button
            onClick={onOpenQuickTx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all shadow-sky-600/20 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Record Transaction</span>
          </button>
        )}
      </div>
    </header>
  );
}
