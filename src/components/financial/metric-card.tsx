"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string | number;
  changePeriod?: string;
  isCurrency?: boolean;
  currency?: string;
  icon?: LucideIcon;
  variant?: "default" | "positive" | "negative" | "warning";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changePeriod = "vs last month",
  isCurrency = true,
  currency = "USD",
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const displayVal = isCurrency ? formatCurrency(value, currency) : value;

  const numChange = typeof change === "string" ? parseFloat(change) : change;
  const hasChange = numChange !== undefined && !isNaN(numChange);
  const isPositiveChange = hasChange && numChange > 0;
  const isNegativeChange = hasChange && numChange < 0;

  const variantBorder = {
    default: "",
    positive: "border-l-4 border-l-emerald-500",
    negative: "border-l-4 border-l-rose-500",
    warning: "border-l-4 border-l-amber-500",
  }[variant];

  return (
    <div
      className={cn(
        "fin-card p-5 flex flex-col justify-between relative overflow-hidden",
        variantBorder,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {displayVal}
        </div>

        {(hasChange || subtitle) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {hasChange && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[11px]",
                  isPositiveChange &&
                    "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50",
                  isNegativeChange &&
                    "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50",
                  numChange === 0 && "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
                )}
              >
                {isPositiveChange && <TrendingUp className="h-3 w-3" />}
                {isNegativeChange && <TrendingDown className="h-3 w-3" />}
                {numChange > 0 ? `+${numChange.toFixed(1)}%` : `${numChange.toFixed(1)}%`}
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              {subtitle || changePeriod}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
