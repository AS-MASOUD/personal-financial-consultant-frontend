"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, ArrowLeft } from "lucide-react";
import { AttentionItem } from "@/types/financial";
import { cn } from "@/lib/utils";

interface AttentionBannerProps {
  items: AttentionItem[];
}

export function AttentionBanner({ items }: AttentionBannerProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
        <span>رادار هشدارهای مالی نیازمند توجه</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isCritical = item.severity === "critical";
          const isWarning = item.severity === "warning";

          return (
            <div
              key={item.id}
              className={cn(
                "p-3.5 rounded-xl border flex flex-col justify-between text-xs transition-all",
                isCritical &&
                  "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200",
                isWarning &&
                  "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200",
                !isCritical &&
                  !isWarning &&
                  "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              )}
            >
              <div>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {isCritical && <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                  {isWarning && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                  {!isCritical && !isWarning && <Info className="h-4 w-4 text-sky-500 shrink-0" />}
                  <span>{item.title}</span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {item.message}
                </p>
              </div>

              {item.action_link && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end">
                  <Link
                    href={item.action_link}
                    className="inline-flex items-center gap-1 font-semibold text-[11px] hover:underline"
                  >
                    <span>مشاهده جزئیات</span>
                    <ArrowLeft className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
