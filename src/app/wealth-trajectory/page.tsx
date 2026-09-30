"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Percent,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
  Wallet,
  RefreshCw,
  Download,
  Check,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  HelpCircle,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCurrency } from "@/components/currency-provider";
import {
  WealthTrajectoryResponse,
  LoanTrajectoryItem,
  InvestmentTrajectoryItem,
  IncomeTrajectoryItem,
  TrajectoryTimelinePoint,
} from "@/types/financial";
import { cn } from "@/lib/utils";

interface RangeOption {
  key: string;
  label: string;
  historyDays: number;
  forecastMonths: number;
}

const RANGE_OPTIONS: RangeOption[] = [
  { key: "1M", label: "۱ ماهه", historyDays: 30, forecastMonths: 1 },
  { key: "3M", label: "۳ ماهه", historyDays: 90, forecastMonths: 3 },
  { key: "6M", label: "۶ ماهه", historyDays: 180, forecastMonths: 6 },
  { key: "1Y", label: "۱ ساله", historyDays: 365, forecastMonths: 12 },
  { key: "2Y", label: "۲ ساله", historyDays: 365, forecastMonths: 24 },
  { key: "5Y", label: "۵ ساله", historyDays: 365, forecastMonths: 60 },
];

const LOAN_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#ec4899", // pink
  "#d946ef", // fuchsia
  "#e11d48", // rose
];

const INVESTMENT_COLORS = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#14b8a6", // teal
  "#84cc16", // lime
];

export default function WealthTrajectoryPage() {
  const { currency, exchangeRate, formatMoney } = useCurrency();
  const factor = currency === "USD" ? 1 / exchangeRate : 1;

  // Range and simulation state
  const [selectedRangeKey, setSelectedRangeKey] = useState<string>("1Y");
  const [growthOverride, setGrowthOverride] = useState<number | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [tempGrowthInput, setTempGrowthInput] = useState<string>("");

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<
    "chart" | "loans" | "investments" | "income" | "timeline" | "ai"
  >("chart");
  const [viewMode, setViewMode] = useState<"individual" | "aggregated">("individual");
  const [showConfidenceArea, setShowConfidenceArea] = useState(true);

  // Selected series for individual breakdown
  const [selectedLoans, setSelectedLoans] = useState<Record<string, boolean>>({});
  const [selectedInvestments, setSelectedInvestments] = useState<Record<string, boolean>>({});
  const [showSalary, setShowSalary] = useState(true);

  // Timeline table filter
  const [timelineFilter, setTimelineFilter] = useState<"all" | "forecast" | "history">("all");

  const currentRange = useMemo(
    () => RANGE_OPTIONS.find((r) => r.key === selectedRangeKey) || RANGE_OPTIONS[3],
    [selectedRangeKey]
  );

  // Fetch wealth trajectory
  const {
    data: trajectoryData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "wealth-trajectory-page",
      currentRange.historyDays,
      currentRange.forecastMonths,
      growthOverride,
    ],
    queryFn: () =>
      api.getWealthTrajectory({
        history_days: currentRange.historyDays,
        forecast_months: currentRange.forecastMonths,
        annual_growth_override: growthOverride !== null ? growthOverride : undefined,
      }),
  });

  // Sync selected checkboxes when data arrives
  useEffect(() => {
    if (trajectoryData?.loans) {
      const initLoans: Record<string, boolean> = {};
      trajectoryData.loans.forEach((l) => {
        initLoans[l.id] = true;
      });
      setSelectedLoans(initLoans);
    }
    if (trajectoryData?.investments) {
      const initInvs: Record<string, boolean> = {};
      trajectoryData.investments.forEach((inv) => {
        initInvs[inv.id] = true;
      });
      setSelectedInvestments(initInvs);
    }
  }, [trajectoryData?.loans, trajectoryData?.investments]);

  // Format data for Recharts
  const timeline = trajectoryData?.timeline;
  const formattedTimeline = useMemo(() => {
    if (!timeline) return [];

    return timeline.map((point) => {
      const rawLiab = Number(point.total_liabilities) || 0;
      const rawInv = Number(point.total_investments) || 0;
      const rawSalary = Number(point.salary_income) || 0;
      const rawNw = Number(point.net_worth) || 0;

      const row: Record<string, string | number | boolean | null | undefined> = {
        date: point.date,
        display_date: point.display_date,
        is_forecast: point.is_forecast,
        total_liabilities: rawLiab * factor,
        total_investments: rawInv * factor,
        salary_income: rawSalary * factor,
        net_worth: rawNw * factor,
        raw_liabilities: rawLiab,
        raw_investments: rawInv,
        raw_salary: rawSalary,
        raw_nw: rawNw,
      };

      if (point.forecast_confidence_upper != null) {
        row.confidence_upper = Number(point.forecast_confidence_upper) * factor;
      }
      if (point.forecast_confidence_lower != null) {
        row.confidence_lower = Number(point.forecast_confidence_lower) * factor;
      }

      if (point.item_values) {
        Object.entries(point.item_values).forEach(([k, v]) => {
          row[`item_${k}`] = (Number(v) || 0) * factor;
          row[`raw_item_${k}`] = Number(v) || 0;
        });
      }

      return row;
    });
  }, [timeline, factor]);

  // Derived high-level metrics
  const latestHistoricalPoint = useMemo(() => {
    if (!timeline || timeline.length === 0) return null;
    const historyPoints = timeline.filter((p) => !p.is_forecast);
    return historyPoints[historyPoints.length - 1] || timeline[0];
  }, [timeline]);

  const endForecastPoint = useMemo(() => {
    if (!timeline || timeline.length === 0) return null;
    return timeline[timeline.length - 1];
  }, [timeline]);

  const currentNw = Number(latestHistoricalPoint?.net_worth || 0);
  const projectedEndNw = Number(endForecastPoint?.net_worth || 0);
  const nwDelta = projectedEndNw - currentNw;
  const nwDeltaPercent =
    currentNw > 0 ? (nwDelta / currentNw) * 100 : 0;

  // Filtered timeline rows for Table
  const filteredTimelineRows = useMemo(() => {
    if (!timeline) return [];
    if (timelineFilter === "forecast") return timeline.filter((p) => p.is_forecast);
    if (timelineFilter === "history") return timeline.filter((p) => !p.is_forecast);
    return timeline;
  }, [timeline, timelineFilter]);

  // Export CSV functionality
  const handleExportCSV = useCallback(() => {
    if (!timeline || timeline.length === 0) return;

    const headers = [
      "تاریخ",
      "عنوان نمایش",
      "نوع داده",
      "کل بدهی و اقساط",
      "کل سرمایه‌گذاری",
      "درآمد حقوق",
      "ارزش خالص (Net Worth)",
      "حد بالا اطمینان",
      "حد پایین اطمینان",
    ];

    const rows = timeline.map((p) => [
      p.date,
      p.display_date,
      p.is_forecast ? "پیش‌بینی" : "تاریخی",
      p.total_liabilities,
      p.total_investments,
      p.salary_income,
      p.net_worth,
      p.forecast_confidence_upper ?? "",
      p.forecast_confidence_lower ?? "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wealth_trajectory_${selectedRangeKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [timeline, selectedRangeKey]);

  // Selection actions
  const handleSelectAll = () => {
    const nextLoans: Record<string, boolean> = {};
    trajectoryData?.loans.forEach((l) => (nextLoans[l.id] = true));
    setSelectedLoans(nextLoans);

    const nextInvs: Record<string, boolean> = {};
    trajectoryData?.investments.forEach((i) => (nextInvs[i.id] = true));
    setSelectedInvestments(nextInvs);
    setShowSalary(true);
  };

  const handleOnlyLoans = () => {
    const nextLoans: Record<string, boolean> = {};
    trajectoryData?.loans.forEach((l) => (nextLoans[l.id] = true));
    setSelectedLoans(nextLoans);

    const nextInvs: Record<string, boolean> = {};
    trajectoryData?.investments.forEach((i) => (nextInvs[i.id] = false));
    setSelectedInvestments(nextInvs);
    setShowSalary(false);
  };

  const handleOnlyInvestments = () => {
    const nextLoans: Record<string, boolean> = {};
    trajectoryData?.loans.forEach((l) => (nextLoans[l.id] = false));
    setSelectedLoans(nextLoans);

    const nextInvs: Record<string, boolean> = {};
    trajectoryData?.investments.forEach((i) => (nextInvs[i.id] = true));
    setSelectedInvestments(nextInvs);
    setShowSalary(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Breadcrumb & Action bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link
              href="/"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              نمای کلی (داشبورد)
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">
              مسیر رشد و استهلاک ثروت (Wealth Trajectory)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  مرکز تحلیل جامع و پیش‌بینی مسیر ثروت
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  شبیه‌ساز هوش مصنوعی
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                شبیه‌سازی دقیق و پویا از استهلاک اقساط، بازدهی مرکب سرمایه‌گذاری‌ها و برآورد زمان‌بندی آزادی مالی
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Range Selector + Scenario Simulator toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Range Options */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-semibold">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedRangeKey(opt.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold",
                  selectedRangeKey === opt.key
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Simulation Toggle Button */}
          <button
            onClick={() => setIsSimulationOpen((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border",
              isSimulationOpen || growthOverride !== null
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-sm"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
            title="تغییر فرضیات بازدهی سالانه"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>شبیه‌ساز سناریو</span>
            {growthOverride !== null && (
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
            )}
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={!timeline || timeline.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="دانلود جدول داده‌ها با فرمت CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">خروجی CSV</span>
          </button>

          {/* Refetch button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all cursor-pointer"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-indigo-500")} />
          </button>
        </div>
      </div>

      {/* 2. Simulation / Growth Override Banner (Collapsible) */}
      {isSimulationOpen && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200 dark:border-indigo-800/80 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  شبیه‌ساز سناریوی نرخ بازدهی سالانه سبد سرمایه‌گذاری
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                با اعمال یک نرخ رشد فرضی متفاوت، نمودار و پیش‌بینی‌های آتی بر پایه آن نرخ شبیه‌سازی خواهند شد.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "محافظه‌کارانه (۱۵٪)", val: 15 },
                { label: "متعادل (۳۰٪)", val: 30 },
                { label: "تهاجمی (۵۰٪)", val: 50 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => {
                    setGrowthOverride(p.val);
                    setTempGrowthInput(String(p.val));
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                    growthOverride === p.val
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                  )}
                >
                  {p.label}
                </button>
              ))}

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
                <input
                  type="number"
                  placeholder="درصد دلخواه..."
                  value={tempGrowthInput}
                  onChange={(e) => setTempGrowthInput(e.target.value)}
                  className="w-24 text-xs font-bold bg-transparent outline-none text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => {
                    const num = parseFloat(tempGrowthInput);
                    if (!isNaN(num) && num >= 0) {
                      setGrowthOverride(num);
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold cursor-pointer hover:bg-indigo-500"
                >
                  اعمال
                </button>
              </div>

              {growthOverride !== null && (
                <button
                  onClick={() => {
                    setGrowthOverride(null);
                    setTempGrowthInput("");
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>ریست به پیش‌فرض</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Top High-Level KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projected Net Worth */}
        <div className="fin-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ارزش خالص در انتهای افق ({currentRange.label})
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2" dir="ltr">
            {formatMoney(projectedEndNw)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {nwDelta >= 0 ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingUp className="h-3.5 w-3.5" />
                +{nwDeltaPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold">
                <TrendingDown className="h-3.5 w-3.5" />
                {nwDeltaPercent.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-400 text-[11px]">نسبت به ارزش خالص امروز</span>
          </div>
        </div>

        {/* Card 2: Debt-Free Payoff Horizon */}
        <div className="fin-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              افق رهایی کامل از بدهی
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-2 truncate">
            {trajectoryData?.debt_free_date || "در مسیر استهلاک منظم"}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>تعداد کل تسهیلات فعال:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {trajectoryData?.loans?.length || 0} فقره
            </span>
          </div>
        </div>

        {/* Card 3: Projected Compounding Profit */}
        <div className="fin-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              سود مرکب مورد انتظار سرمایه‌گذاری
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2" dir="ltr">
            +{formatMoney(trajectoryData?.projected_total_profit || 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>تعداد موقعیت‌های فعال:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {trajectoryData?.investments?.length || 0} دارایی
            </span>
          </div>
        </div>

        {/* Card 4: Debt Interest Saved */}
        <div className="fin-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              صرفه‌جویی در سود بانکی
            </span>
            <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-2" dir="ltr">
            {formatMoney(trajectoryData?.total_debt_interest_saved || 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>نقطه برابری ثروت:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {trajectoryData?.crossover_date ? "محقق شده" : "در افق پیش‌بینی"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: "chart" as const, label: "نمودار تفکیکی جامع", icon: Layers },
          {
            id: "loans" as const,
            label: `تسهیلات و استهلاک وام (${trajectoryData?.loans?.length || 0})`,
            icon: ShieldAlert,
          },
          {
            id: "investments" as const,
            label: `سبد سرمایه‌گذاری (${trajectoryData?.investments?.length || 0})`,
            icon: Coins,
          },
          { id: "income" as const, label: "جریان درآمد و حقوق", icon: Wallet },
          { id: "timeline" as const, label: "جدول گام‌به‌گام زمان‌بندی", icon: FileSpreadsheet },
          { id: "ai" as const, label: "توصیه و تحلیل هوش مصنوعی", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. TAB CONTENTS */}
      {/* TAB 1: ADVANCED CHART */}
      {activeTab === "chart" && (
        <div className="fin-card p-5 sm:p-6 space-y-6">
          {/* Controls Bar: Mode toggle + Quick filter presets */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                حالت رسم نمودار:
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setViewMode("individual")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                    viewMode === "individual"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  تفکیک تک‌تک وام‌ها و دارایی‌ها
                </button>
                <button
                  onClick={() => setViewMode("aggregated")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                    viewMode === "aggregated"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  تجمیعی کل بدهی و سرمایه
                </button>
              </div>
            </div>

            {viewMode === "individual" && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">فیلترهای سریع:</span>
                <button
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                >
                  انتخاب همه
                </button>
                <button
                  onClick={handleOnlyLoans}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold cursor-pointer"
                >
                  فقط اقساط وام‌ها
                </button>
                <button
                  onClick={handleOnlyInvestments}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold cursor-pointer"
                >
                  فقط سرمایه‌گذاری‌ها
                </button>
                <button
                  onClick={() => setShowConfidenceArea((prev) => !prev)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-all",
                    showConfidenceArea
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                  )}
                >
                  بازه اطمینان پیش‌بینی
                </button>
              </div>
            )}
          </div>

          {/* Individual Item Checkboxes Pills */}
          {viewMode === "individual" && (
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 space-y-3.5">
              {/* Loans Pills */}
              {trajectoryData?.loans && trajectoryData.loans.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    اقساط و تسهیلات جهت نمایش روی نمودار:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {trajectoryData.loans.map((loan, idx) => {
                      const color = LOAN_COLORS[idx % LOAN_COLORS.length];
                      const isChecked = !!selectedLoans[loan.id];
                      return (
                        <button
                          key={loan.id}
                          onClick={() =>
                            setSelectedLoans((prev) => ({
                              ...prev,
                              [loan.id]: !prev[loan.id],
                            }))
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                            isChecked
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent opacity-60"
                          )}
                          style={{ borderColor: isChecked ? color : "transparent" }}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span>{loan.name}</span>
                          <span className="text-[10px] text-slate-400" dir="ltr">
                            ({formatMoney(loan.current_balance)})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Investments Pills */}
              {trajectoryData?.investments && trajectoryData.investments.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    دارایی‌ها و سرمایه‌گذاری‌ها جهت نمایش روی نمودار:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {trajectoryData.investments.map((inv, idx) => {
                      const color = INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length];
                      const isChecked = !!selectedInvestments[inv.id];
                      return (
                        <button
                          key={inv.id}
                          onClick={() =>
                            setSelectedInvestments((prev) => ({
                              ...prev,
                              [inv.id]: !prev[inv.id],
                            }))
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                            isChecked
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent opacity-60"
                          )}
                          style={{ borderColor: isChecked ? color : "transparent" }}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span>{inv.name}</span>
                          <span className="text-[10px] text-slate-400" dir="ltr">
                            ({formatMoney(inv.current_value)})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Salary toggle pill */}
              <div className="pt-1">
                <button
                  onClick={() => setShowSalary((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                    showSalary
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-sky-400 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent opacity-60"
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span>حقوق و ورودی درآمد ماهانه</span>
                  <span className="text-[10px] text-slate-400" dir="ltr">
                    ({formatMoney(trajectoryData?.baseline_salary || 0)})
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Chart Canvas */}
          <div className="h-[420px] sm:h-[480px] w-full p-2 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                  <span>در حال محاسبه و استخراج داده‌های شبیه‌سازی...</span>
                </div>
              </div>
            ) : formattedTimeline.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                داده‌ای برای افق زمانی انتخاب شده یافت نشد.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={formattedTimeline}
                  margin={{ top: 20, right: 20, left: 15, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="pageConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="pageLiabGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.15}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="display_date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      currency === "USD"
                        ? `$${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val.toFixed(0)}`
                        : `${
                            val >= 1000000
                              ? (val / 1000000).toFixed(0) + " م.ت"
                              : val >= 1000
                              ? (val / 1000).toFixed(0) + " ه.ت"
                              : val.toFixed(0)
                          }`
                    }
                  />

                  {/* Today Divider */}
                  <ReferenceLine
                    x="امروز"
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "امروز (آغاز پیش‌بینی)",
                      fill: "#6366f1",
                      fontSize: 11,
                      position: "top",
                    }}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const row = payload[0]?.payload;
                        const isForecast = row?.is_forecast;

                        return (
                          <div
                            className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl text-xs space-y-2.5 border border-slate-700 min-w-[260px] text-right"
                            dir="rtl"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="font-bold text-slate-200">
                                {label} ({row?.date})
                              </span>
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                  isForecast
                                    ? "bg-purple-900/80 text-purple-300 border-purple-700"
                                    : "bg-sky-900/80 text-sky-300 border-sky-700"
                                )}
                              >
                                {isForecast ? "پیش‌بینی هوش مصنوعی" : "داده واقعی گذشته"}
                              </span>
                            </div>

                            {viewMode === "aggregated" ? (
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-emerald-400">
                                  <span>کل ارزش سرمایه‌گذاری:</span>
                                  <span className="font-bold" dir="ltr">
                                    {formatMoney(row?.raw_investments)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-rose-400">
                                  <span>کل مانده بدهی و اقساط:</span>
                                  <span className="font-bold" dir="ltr">
                                    {formatMoney(row?.raw_liabilities)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sky-300">
                                  <span>حقوق دریافتی ماهانه:</span>
                                  <span className="font-bold" dir="ltr">
                                    {formatMoney(row?.raw_salary)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-indigo-300 pt-1.5 border-t border-slate-800 font-bold">
                                  <span>ارزش خالص (Net Worth):</span>
                                  <span dir="ltr">{formatMoney(row?.raw_nw)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                                {/* Checked loans */}
                                {trajectoryData?.loans?.map((loan, idx) => {
                                  if (!selectedLoans[loan.id]) return null;
                                  const rawVal = row?.[`raw_item_${loan.id}`] ?? 0;
                                  const color = LOAN_COLORS[idx % LOAN_COLORS.length];
                                  return (
                                    <div
                                      key={loan.id}
                                      className="flex justify-between items-center text-[11px]"
                                      style={{ color }}
                                    >
                                      <span className="truncate max-w-[140px]">{loan.name}:</span>
                                      <span className="font-bold" dir="ltr">
                                        {formatMoney(rawVal)}
                                      </span>
                                    </div>
                                  );
                                })}

                                {/* Checked investments */}
                                {trajectoryData?.investments?.map((inv, idx) => {
                                  if (!selectedInvestments[inv.id]) return null;
                                  const rawVal = row?.[`raw_item_${inv.id}`] ?? 0;
                                  const color =
                                    INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length];
                                  return (
                                    <div
                                      key={inv.id}
                                      className="flex justify-between items-center text-[11px]"
                                      style={{ color }}
                                    >
                                      <span className="truncate max-w-[140px]">{inv.name}:</span>
                                      <span className="font-bold" dir="ltr">
                                        {formatMoney(rawVal)}
                                      </span>
                                    </div>
                                  );
                                })}

                                {showSalary && (
                                  <div className="flex justify-between items-center text-[11px] text-sky-400 pt-1.5 border-t border-slate-800">
                                    <span>حقوق ماهانه:</span>
                                    <span className="font-bold" dir="ltr">
                                      {formatMoney(row?.raw_salary)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Aggregated Mode Rendering */}
                  {viewMode === "aggregated" && (
                    <>
                      {showConfidenceArea && (
                        <Area
                          type="monotone"
                          dataKey="confidence_upper"
                          stroke="transparent"
                          fill="url(#pageConfidenceGrad)"
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="total_liabilities"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fill="url(#pageLiabGrad)"
                      />
                      <Line
                        type="monotone"
                        dataKey="total_investments"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="salary_income"
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </>
                  )}

                  {/* Individual Mode Rendering */}
                  {viewMode === "individual" && (
                    <>
                      {/* Individual Loans lines */}
                      {trajectoryData?.loans?.map((loan, idx) => {
                        if (!selectedLoans[loan.id]) return null;
                        const color = LOAN_COLORS[idx % LOAN_COLORS.length];
                        return (
                          <Line
                            key={loan.id}
                            type="monotone"
                            dataKey={`item_${loan.id}`}
                            name={loan.name}
                            stroke={color}
                            strokeWidth={2.2}
                            strokeDasharray="4 3"
                            dot={{ r: 2.5, fill: color }}
                          />
                        );
                      })}

                      {/* Individual Investments lines */}
                      {trajectoryData?.investments?.map((inv, idx) => {
                        if (!selectedInvestments[inv.id]) return null;
                        const color = INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length];
                        return (
                          <Line
                            key={inv.id}
                            type="monotone"
                            dataKey={`item_${inv.id}`}
                            name={inv.name}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ r: 2.5, fill: color }}
                          />
                        );
                      })}

                      {/* Salary line */}
                      {showSalary && (
                        <Line
                          type="monotone"
                          dataKey="salary_income"
                          stroke="#0284c7"
                          strokeWidth={1.8}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      )}
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOANS & AMORTIZATION TABLE */}
      {activeTab === "loans" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                جدول تفکیکی کلیه تسهیلات و برنامه استهلاک وام‌ها
              </h2>
              <p className="text-xs text-slate-500">
                بررسی روند تسویه اصل بدهی، سود و تاریخ برآورد تسویه صفر به ازای هر فقره وام
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900">
              مجموع مانده بدهی فعلی: {formatMoney(trajectoryData?.baseline_liabilities || 0)}
            </span>
          </div>

          {trajectoryData?.loans && trajectoryData.loans.length > 0 ? (
            <>
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trajectoryData.loans.map((loan, idx) => {
                  const color = LOAN_COLORS[idx % LOAN_COLORS.length];
                  return (
                    <div
                      key={loan.id}
                      className="fin-card p-5 space-y-3.5 border-t-4"
                      style={{ borderTopColor: color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {loan.name}
                          </h4>
                        </div>
                        {loan.lender && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                            {loan.lender}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">مانده اصل وام:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                            {formatMoney(loan.current_balance)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">قسط ماهانه:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                            {formatMoney(loan.monthly_payment)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">نرخ سود سالانه:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400" dir="ltr">
                            {loan.interest_rate_percent}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">تسویه تخمینی:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {loan.remaining_months} ماه دیگر
                          </span>
                        </div>
                      </div>

                      {/* Repayment Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>پیشرفت استهلاک اصل بدهی:</span>
                          <span className="font-bold">{loan.repaid_percent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all rounded-full"
                            style={{ width: `${Math.min(100, Number(loan.repaid_percent))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Amortization Table */}
              <div className="fin-card overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    جدول کلی تسهیلات و سررسیدهای بازپرداخت
                  </h3>
                  <Link
                    href="/liabilities"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>ویرایش و مدیریت تسهیلات</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3.5">عنوان تسهیلات</th>
                        <th className="p-3.5">موسسه / بانک</th>
                        <th className="p-3.5">مانده فعلی بدهی</th>
                        <th className="p-3.5">قسط ماهانه</th>
                        <th className="p-3.5">نرخ سود</th>
                        <th className="p-3.5">اقساط باقیمانده</th>
                        <th className="p-3.5">تاریخ تخمینی تسویه</th>
                        <th className="p-3.5">درصد تسویه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {trajectoryData.loans.map((loan) => (
                        <tr
                          key={loan.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {loan.name}
                          </td>
                          <td className="p-3.5 text-slate-500">{loan.lender || "—"}</td>
                          <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                            {formatMoney(loan.current_balance)}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                            {formatMoney(loan.monthly_payment)}
                          </td>
                          <td className="p-3.5 text-amber-600 font-bold" dir="ltr">
                            {loan.interest_rate_percent}%
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300">
                            {loan.remaining_months} ماه
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                            {loan.estimated_payoff_date}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                              {loan.repaid_percent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="fin-card p-12 text-center text-xs text-slate-400">
              هیچ وام یا بدهی فعالی در حساب کاربری ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVESTMENTS TABLE */}
      {activeTab === "investments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                جدول تفکیکی دارایی‌ها و پیش‌بینی سود مرکب
              </h2>
              <p className="text-xs text-slate-500">
                ارزش فعلی، بازدهی مورد انتظار و پیش‌بینی ارزش آتی سرمایه‌گذاری‌ها
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
              مجموع ارزش پورتفولیو: {formatMoney(trajectoryData?.baseline_investments || 0)}
            </span>
          </div>

          {trajectoryData?.investments && trajectoryData.investments.length > 0 ? (
            <>
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trajectoryData.investments.map((inv, idx) => {
                  const color = INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length];
                  return (
                    <div
                      key={inv.id}
                      className="fin-card p-5 space-y-3.5 border-t-4"
                      style={{ borderTopColor: color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {inv.name}
                            </h4>
                            <span className="text-[10px] text-slate-400">{inv.symbol}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          بازدهی: {inv.projected_annual_growth_rate}% سالانه
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">ارزش فعلی:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {formatMoney(inv.current_value)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">افق ۱ ساله:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                            {formatMoney(inv.projected_value_1y)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">افق ۲ ساله:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400" dir="ltr">
                            {formatMoney(inv.projected_value_2y)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Table */}
              <div className="fin-card overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    جدول تفکیک کلیه موقعیت‌های سرمایه‌گذاری
                  </h3>
                  <Link
                    href="/portfolio"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>مدیریت دارایی‌ها در پورتفولیو</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3.5">نام دارایی</th>
                        <th className="p-3.5">نماد</th>
                        <th className="p-3.5">کلاس دارایی</th>
                        <th className="p-3.5">ارزش فعلی</th>
                        <th className="p-3.5">نرخ رشد سالانه</th>
                        <th className="p-3.5">ارزش ۱ ساله</th>
                        <th className="p-3.5">ارزش ۲ ساله</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {trajectoryData.investments.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {inv.name}
                          </td>
                          <td className="p-3.5 text-slate-400">{inv.symbol}</td>
                          <td className="p-3.5 text-slate-500">{inv.asset_class}</td>
                          <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {formatMoney(inv.current_value)}
                          </td>
                          <td className="p-3.5 text-indigo-600 font-bold" dir="ltr">
                            {inv.projected_annual_growth_rate}%
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                            {formatMoney(inv.projected_value_1y)}
                          </td>
                          <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400" dir="ltr">
                            {formatMoney(inv.projected_value_2y)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="fin-card p-12 text-center text-xs text-slate-400">
              هیچ دارایی یا موقعیت سرمایه‌گذاری فعالی در حساب کاربری ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SALARY & INCOME STREAM */}
      {activeTab === "income" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                جریان ورودی حقوق و منابع درآمد ماهانه
              </h2>
              <p className="text-xs text-slate-500">
                موتور اصلی تامین مالی برای استهلاک تسهیلات و تزریق ماهانه به سبد سرمایه‌گذاری
              </p>
            </div>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-900">
              درآمد ماهانه فعال: {formatMoney(trajectoryData?.baseline_salary || 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="fin-card p-5 space-y-1">
              <span className="text-xs text-slate-500 font-semibold">مبلغ دریافتی ماهانه:</span>
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400" dir="ltr">
                {formatMoney(trajectoryData?.baseline_salary || 0)}
              </div>
            </div>

            <div className="fin-card p-5 space-y-1">
              <span className="text-xs text-slate-500 font-semibold">ارزش سالانه کل ورودی:</span>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400" dir="ltr">
                {formatMoney(Number(trajectoryData?.baseline_salary || 0) * 12)}
              </div>
            </div>

            <div className="fin-card p-5 space-y-1">
              <span className="text-xs text-slate-500 font-semibold">پایداری جریان نقدی:</span>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="h-4 w-4" />
                تکرارشونده و پایدار
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STEP-BY-STEP TIMELINE SCHEDULE TABLE */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                جدول ماهانه زمان‌بندی استهلاک و رشد سرمایه
              </h2>
              <p className="text-xs text-slate-500">
                مشاهده ارقام دقیق بدهی، سرمایه‌گذاری و ارزش خالص در هر گام زمانی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setTimelineFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    timelineFilter === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-500"
                  )}
                >
                  همه گام‌ها ({timeline?.length || 0})
                </button>
                <button
                  onClick={() => setTimelineFilter("forecast")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    timelineFilter === "forecast"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-500"
                  )}
                >
                  فقط پیش‌بینی
                </button>
                <button
                  onClick={() => setTimelineFilter("history")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    timelineFilter === "history"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-500"
                  )}
                >
                  فقط گذشته
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>دانلود CSV</span>
              </button>
            </div>
          </div>

          <div className="fin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3.5">تاریخ گام</th>
                    <th className="p-3.5">عنوان بازه</th>
                    <th className="p-3.5">وضعیت</th>
                    <th className="p-3.5">کل بدهی‌ها</th>
                    <th className="p-3.5">کل سرمایه‌گذاری</th>
                    <th className="p-3.5">حقوق ماهانه</th>
                    <th className="p-3.5">ارزش خالص (Net Worth)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTimelineRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors",
                        row.display_date === "امروز" &&
                          "bg-indigo-50/50 dark:bg-indigo-950/30 font-bold"
                      )}
                    >
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">
                        {row.date}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {row.display_date}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            row.is_forecast
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                              : "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                          )}
                        >
                          {row.is_forecast ? "پیش‌بینی هوش مصنوعی" : "داده واقعی گذشته"}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                        {formatMoney(row.total_liabilities)}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                        {formatMoney(row.total_investments)}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400" dir="ltr">
                        {formatMoney(row.salary_income)}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-slate-100" dir="ltr">
                        {formatMoney(row.net_worth)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI NARRATIVE & STRATEGIC PLAYBOOK */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800/70 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              <Sparkles className="h-5 w-5" />
              <span>تحلیل استراتژیک مدل هوش مصنوعی مالی</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {trajectoryData?.ai_narrative}
            </p>
          </div>

          {/* Strategic Milestones Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fin-card p-5 space-y-1">
              <div className="flex items-center gap-2 text-rose-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-bold">تاریخ آزادی از بدهی</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {trajectoryData?.debt_free_date || "در مسیر استهلاک منظم"}
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                نقطه صفر شدن کلیه اقساط و تعهدات مالی
              </span>
            </div>

            <div className="fin-card p-5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <Percent className="h-4 w-4" />
                <span className="text-xs font-bold">سود سرمایه‌گذاری برآورد شده</span>
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                +{formatMoney(trajectoryData?.projected_total_profit || 0)}
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                رشد مرکب دارایی‌ها در طول افق زمانی
              </span>
            </div>

            <div className="fin-card p-5 space-y-1">
              <div className="flex items-center gap-2 text-sky-500 mb-1">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs font-bold">صرفه‌جویی در سود بانکی</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                {formatMoney(trajectoryData?.total_debt_interest_saved || 0)}
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                با پایبندی به برنامه منظم بازپرداخت
              </span>
            </div>

            <div className="fin-card p-5 space-y-1">
              <div className="flex items-center gap-2 text-indigo-500 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-xs font-bold">نقطه برابری ثروت (Crossover)</span>
              </div>
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                {trajectoryData?.crossover_date ? "محقق گردیده است" : "پیش از پایان افق شبیه‌سازی"}
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                برتری ارزش خالص دارایی‌ها بر کل بدهی‌ها
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
