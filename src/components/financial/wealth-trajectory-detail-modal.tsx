"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  X,
  Sparkles,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  Percent,
  SlidersHorizontal,
  Wallet,
  Clock,
  Check,
  RotateCcw,
} from "lucide-react";
import { useCurrency } from "@/components/currency-provider";
import {
  WealthTrajectoryResponse,
  LoanTrajectoryItem,
  InvestmentTrajectoryItem,
  IncomeTrajectoryItem,
} from "@/types/financial";

interface WealthTrajectoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WealthTrajectoryResponse;
  selectedRange: "3M_6M" | "6M_1Y" | "1Y_2Y" | "5Y";
}

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

export function WealthTrajectoryDetailModal({
  isOpen,
  onClose,
  data,
}: WealthTrajectoryDetailModalProps) {
  const { currency, exchangeRate, formatMoney } = useCurrency();
  const [activeTab, setActiveTab] = useState<"chart" | "loans" | "investments" | "income" | "ai">("chart");
  const [viewMode, setViewMode] = useState<"aggregated" | "individual">("individual");

  // Selected series for individual breakdown chart
  const [selectedLoans, setSelectedLoans] = useState<Record<string, boolean>>({});
  const [selectedInvestments, setSelectedInvestments] = useState<Record<string, boolean>>({});
  const [showSalary, setShowSalary] = useState(true);

  // Initialize selected items when data changes
  useEffect(() => {
    if (data?.loans) {
      const initLoans: Record<string, boolean> = {};
      data.loans.forEach((l) => {
        initLoans[l.id] = true;
      });
      setSelectedLoans(initLoans);
    }
    if (data?.investments) {
      const initInvs: Record<string, boolean> = {};
      data.investments.forEach((inv) => {
        initInvs[inv.id] = true;
      });
      setSelectedInvestments(initInvs);
    }
  }, [data]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const factor = currency === "USD" ? 1 / exchangeRate : 1;

  // Format timeline data for Recharts
  const formattedTimeline = useMemo(() => {
    if (!data?.timeline) return [];

    return data.timeline.map((point) => {
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

      // Add individual item values scaled by factor
      if (point.item_values) {
        Object.entries(point.item_values).forEach(([k, v]) => {
          row[`item_${k}`] = (Number(v) || 0) * factor;
          row[`raw_item_${k}`] = Number(v) || 0;
        });
      }

      return row;
    });
  }, [data?.timeline, factor]);

  // Quick selection helpers
  const handleSelectAll = () => {
    const nextLoans: Record<string, boolean> = {};
    data?.loans.forEach((l) => (nextLoans[l.id] = true));
    setSelectedLoans(nextLoans);

    const nextInvs: Record<string, boolean> = {};
    data?.investments.forEach((i) => (nextInvs[i.id] = true));
    setSelectedInvestments(nextInvs);
    setShowSalary(true);
  };

  const handleOnlyLoans = () => {
    const nextLoans: Record<string, boolean> = {};
    data?.loans.forEach((l) => (nextLoans[l.id] = true));
    setSelectedLoans(nextLoans);

    const nextInvs: Record<string, boolean> = {};
    data?.investments.forEach((i) => (nextInvs[i.id] = false));
    setSelectedInvestments(nextInvs);
    setShowSalary(false);
  };

  const handleOnlyInvestments = () => {
    const nextLoans: Record<string, boolean> = {};
    data?.loans.forEach((l) => (nextLoans[l.id] = false));
    setSelectedLoans(nextLoans);

    const nextInvs: Record<string, boolean> = {};
    data?.investments.forEach((i) => (nextInvs[i.id] = true));
    setSelectedInvestments(nextInvs);
    setShowSalary(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-right" dir="rtl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  نمای تفکیکی دارایی‌ها، اقساط و پیش‌بینی هوش مصنوعی
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  AI Forecast
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مسیر استهلاک هر وام و قسط، نرخ رشد تک‌تک سرمایه‌گذاری‌ها و جریان حقوق ماهانه
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="بستن پنجره"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto shrink-0 bg-white dark:bg-slate-900">
          {[
            { id: "chart" as const, label: "نمودار تفکیکی پیشرفته" },
            { id: "loans" as const, label: `اقساط و وام‌ها (${data?.loans?.length || 0})` },
            { id: "investments" as const, label: `سرمایه‌گذاری‌ها (${data?.investments?.length || 0})` },
            { id: "income" as const, label: "جریان حقوق و درآمد" },
            { id: "ai" as const, label: "تحلیل و توصیه هوش مصنوعی" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: ADVANCED CHART */}
          {activeTab === "chart" && (
            <div className="space-y-4">
              {/* Controls bar: Mode toggle + Filter presets */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    حالت نمایش:
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <button
                      onClick={() => setViewMode("individual")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        viewMode === "individual"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      تفکیک کامل تک‌تک آیتم‌ها
                    </button>
                    <button
                      onClick={() => setViewMode("aggregated")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        viewMode === "aggregated"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      تجمیعی کل بدهی و سرمایه
                    </button>
                  </div>
                </div>

                {viewMode === "individual" && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                    >
                      همه موارد
                    </button>
                    <button
                      onClick={handleOnlyLoans}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold cursor-pointer"
                    >
                      فقط اقساط
                    </button>
                    <button
                      onClick={handleOnlyInvestments}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold cursor-pointer"
                    >
                      فقط سرمایه‌گذاری‌ها
                    </button>
                  </div>
                )}
              </div>

              {/* Individual Item Checkboxes */}
              {viewMode === "individual" && (
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                  {/* Loans Pills */}
                  {data?.loans && data.loans.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        انتخاب اقساط و وام‌ها جهت نمایش:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {data.loans.map((loan, idx) => {
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent opacity-60"
                              }`}
                              style={{
                                borderColor: isChecked ? color : "transparent",
                              }}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
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
                  {data?.investments && data.investments.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        انتخاب سرمایه‌گذاری‌ها جهت نمایش:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {data.investments.map((inv, idx) => {
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent opacity-60"
                              }`}
                              style={{
                                borderColor: isChecked ? color : "transparent",
                              }}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
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

                  {/* Salary Toggle */}
                  <div className="pt-1">
                    <button
                      onClick={() => setShowSalary((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        showSalary
                          ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-sky-400 shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent opacity-60"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <span>حقوق و دریافتی ماهانه</span>
                      <span className="text-[10px] text-slate-400" dir="ltr">
                        ({formatMoney(data?.baseline_salary)})
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Chart Canvas */}
              <div className="h-[360px] sm:h-[400px] w-full p-2 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={formattedTimeline}
                    margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="detailConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="detailLiabGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

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
                          : `${val >= 1000000 ? (val / 1000000).toFixed(0) + " م.ت" : val >= 1000 ? (val / 1000).toFixed(0) + " ه.ت" : val.toFixed(0)}`
                      }
                    />

                    {/* Today marker divider */}
                    <ReferenceLine
                      x="امروز"
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{
                        value: "امروز (نقطه آغاز پیش‌بینی)",
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
                            <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 border border-slate-700 min-w-[240px] text-right" dir="rtl">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="font-bold text-slate-200">
                                  {label} ({row?.date})
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isForecast
                                      ? "bg-purple-900/80 text-purple-300 border border-purple-700"
                                      : "bg-sky-900/80 text-sky-300 border border-sky-700"
                                  }`}
                                >
                                  {isForecast ? "پیش‌بینی هوش مصنوعی" : "داده تاریخی"}
                                </span>
                              </div>

                              {viewMode === "aggregated" ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-emerald-400">
                                    <span>کل سرمایه‌گذاری:</span>
                                    <span className="font-bold" dir="ltr">
                                      {formatMoney(row?.raw_investments)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-rose-400">
                                    <span>کل بدهی و اقساط:</span>
                                    <span className="font-bold" dir="ltr">
                                      {formatMoney(row?.raw_liabilities)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sky-300">
                                    <span>حقوق و دریافتی ماهانه:</span>
                                    <span className="font-bold" dir="ltr">
                                      {formatMoney(row?.raw_salary)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-indigo-300 pt-1 border-t border-slate-800">
                                    <span>ارزش خالص (Net Worth):</span>
                                    <span className="font-bold" dir="ltr">
                                      {formatMoney(row?.raw_nw)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                                  {/* Render checked loans */}
                                  {data?.loans?.map((loan, idx) => {
                                    if (!selectedLoans[loan.id]) return null;
                                    const rawVal = row?.[`raw_item_${loan.id}`] ?? 0;
                                    const color = LOAN_COLORS[idx % LOAN_COLORS.length];
                                    return (
                                      <div key={loan.id} className="flex justify-between items-center text-[11px]" style={{ color }}>
                                        <span className="truncate max-w-[130px]">{loan.name}:</span>
                                        <span className="font-bold" dir="ltr">{formatMoney(rawVal)}</span>
                                      </div>
                                    );
                                  })}

                                  {/* Render checked investments */}
                                  {data?.investments?.map((inv, idx) => {
                                    if (!selectedInvestments[inv.id]) return null;
                                    const rawVal = row?.[`raw_item_${inv.id}`] ?? 0;
                                    const color = INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length];
                                    return (
                                      <div key={inv.id} className="flex justify-between items-center text-[11px]" style={{ color }}>
                                        <span className="truncate max-w-[130px]">{inv.name}:</span>
                                        <span className="font-bold" dir="ltr">{formatMoney(rawVal)}</span>
                                      </div>
                                    );
                                  })}

                                  {showSalary && (
                                    <div className="flex justify-between items-center text-[11px] text-sky-400 pt-1 border-t border-slate-800">
                                      <span>حقوق ماهانه:</span>
                                      <span className="font-bold" dir="ltr">{formatMoney(row?.raw_salary)}</span>
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
                        <Area
                          type="monotone"
                          dataKey="confidence_upper"
                          stroke="transparent"
                          fill="url(#detailConfidenceGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="total_liabilities"
                          stroke="#f43f5e"
                          strokeWidth={2.5}
                          fill="url(#detailLiabGrad)"
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
                        {data?.loans?.map((loan, idx) => {
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
                        {data?.investments?.map((inv, idx) => {
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
              </div>
            </div>
          )}

          {/* TAB 2: LOANS & INSTALLMENTS BREAKDOWN */}
          {activeTab === "loans" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    جدول تفکیکی کلیه تسهیلات و اقساط ماهانه
                  </h3>
                  <p className="text-xs text-slate-500">
                    روند استهلاک اصل بدهی، سود و تاریخ برآورد تسویه صفر
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900">
                  مجموع مانده بدهی: {formatMoney(data?.baseline_liabilities)}
                </span>
              </div>

              {data?.loans && data.loans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.loans.map((loan, idx) => {
                    const color = LOAN_COLORS[idx % LOAN_COLORS.length];
                    return (
                      <div
                        key={loan.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
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
                            <span className="text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              {loan.lender}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">مانده فعلی:</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                              {formatMoney(loan.current_balance)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">قسط ماهانه:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                              {formatMoney(loan.monthly_payment)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">نرخ سود سالانه:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400" dir="ltr">
                              {loan.interest_rate_percent}%
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">تسویه تخمینی:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {loan.remaining_months} ماه دیگر ({loan.estimated_payoff_date})
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>پیشرفت بازپرداخت اصل وام:</span>
                            <span>{loan.repaid_percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  هیچ وام یا بدهی فعالی ثبت نشده است.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVESTMENTS BREAKDOWN */}
          {activeTab === "investments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    جدول تفکیکی دارایی‌ها و پیش‌بینی سود مرکب
                  </h3>
                  <p className="text-xs text-slate-500">
                    ارزش فعلی، بازدهی مورد انتظار و شبیه‌سازی ارزش آتی دارایی‌ها
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  مجموع ارزش سرمایه‌گذاری: {formatMoney(data?.baseline_investments)}
                </span>
              </div>

              {data?.investments && data.investments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.investments.map((inv, idx) => {
                    const color = INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length];
                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
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
                            بازدهی تخمینی: {inv.projected_annual_growth_rate}% سالانه
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">ارزش فعلی:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                              {formatMoney(inv.current_value)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">پیش‌بینی ۱ ساله:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                              {formatMoney(inv.projected_value_1y)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400 block text-[10px]">پیش‌بینی ۲ ساله:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400" dir="ltr">
                              {formatMoney(inv.projected_value_2y)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  دارایی یا موقعیت سرمایه‌گذاری فعالی ثبت نشده است.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SALARY & INCOME */}
          {activeTab === "income" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    جریان حقوق و ورودی درآمدهای ماهانه
                  </h3>
                  <p className="text-xs text-slate-500">
                    موتور اصلی تامین مالی برای استهلاک اقساط و تزریق به سرمایه‌گذاری
                  </p>
                </div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-900">
                  حقوق ماهانه فعال: {formatMoney(data?.baseline_salary)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">مبلغ دریافتی ماهانه:</span>
                  <div className="text-lg font-bold text-sky-600 dark:text-sky-400" dir="ltr">
                    {formatMoney(data?.baseline_salary)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">ارزش سالانه کل ورودی:</span>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400" dir="ltr">
                    {formatMoney(Number(data?.baseline_salary) * 12)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">وضعیت استمرار:</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="h-4 w-4" />
                    جریان نقدی پایدار و تکرارشونده
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI NARRATIVE & INSIGHTS */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/70 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>تحلیل استراتژیک مدل هوش مصنوعی مالی</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {data?.ai_narrative}
                </p>
              </div>

              {/* Milestones grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-rose-500 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold">تاریخ آزادی از بدهی</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {data?.debt_free_date || "در مسیر استهلاک منظم"}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    لحظه صفر شدن کلیه اقساط و وام‌ها
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-500 mb-1">
                    <Percent className="h-4 w-4" />
                    <span className="text-xs font-bold">سود سرمایه‌گذاری برآورد شده</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                    +{formatMoney(data?.projected_total_profit)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    افزایش ارزش سبد ناشی از رشد مرکب
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sky-500 mb-1">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-xs font-bold">صرفه‌جویی در سود بانکی</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                    {formatMoney(data?.total_debt_interest_saved)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    با حفظ برنامه تسویه منظم
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-500 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-bold">نقطه برابری ثروت</span>
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {data?.crossover_date ? "محقق گردیده است" : "پیش از افق شبیه‌سازی"}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    برتری ارزش دارایی‌ها بر کل تعهدات
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>محاسبات و برآوردها بر اساس داده‌های مالی زنده و الگوریتم‌های شبیه‌سازی استهلاک صورت پذیرفته است.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
}
