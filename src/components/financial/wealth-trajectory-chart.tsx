"use client";

import React, { useState, useMemo } from "react";
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
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Percent,
  CheckCircle2,
  Wallet,
  ShieldAlert,
  Calendar,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCurrency } from "@/components/currency-provider";
import { WealthTrajectoryDetailModal } from "@/components/financial/wealth-trajectory-detail-modal";
import { WealthTrajectoryResponse } from "@/types/financial";

type RangeKey = "3M_6M" | "6M_1Y" | "1Y_2Y" | "5Y";

interface RangeOption {
  key: RangeKey;
  label: string;
  historyDays: number;
  forecastMonths: number;
}

const RANGE_OPTIONS: RangeOption[] = [
  { key: "3M_6M", label: "۳م گذشته + ۶م آینده", historyDays: 90, forecastMonths: 6 },
  { key: "6M_1Y", label: "۶م گذشته + ۱ سال آینده", historyDays: 180, forecastMonths: 12 },
  { key: "1Y_2Y", label: "۱ سال گذشته + ۲ سال آینده", historyDays: 365, forecastMonths: 24 },
  { key: "5Y", label: "افق ۵ ساله هوش مصنوعی", historyDays: 365, forecastMonths: 60 },
];

export function WealthTrajectoryChart() {
  const { currency, exchangeRate, formatMoney } = useCurrency();
  const [selectedRange, setSelectedRange] = useState<RangeKey>("6M_1Y");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Series visibility toggles
  const [showInvestments, setShowInvestments] = useState(true);
  const [showLiabilities, setShowLiabilities] = useState(true);
  const [showSalary, setShowSalary] = useState(true);
  const [showAIPrediction, setShowAIPrediction] = useState(true);

  const activeRangeConfig = useMemo(
    () => RANGE_OPTIONS.find((r) => r.key === selectedRange) || RANGE_OPTIONS[1],
    [selectedRange]
  );

  const { data: trajectoryData, isLoading } = useQuery({
    queryKey: [
      "wealth-trajectory",
      activeRangeConfig.historyDays,
      activeRangeConfig.forecastMonths,
    ],
    queryFn: () =>
      api.getWealthTrajectory({
        history_days: activeRangeConfig.historyDays,
        forecast_months: activeRangeConfig.forecastMonths,
      }),
  });

  const factor = currency === "USD" ? 1 / exchangeRate : 1;

  // Format data points for chart
  const formattedData = useMemo(() => {
    if (!trajectoryData?.timeline) return [];

    return trajectoryData.timeline.map((point) => {
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

      if (point.is_forecast && showAIPrediction) {
        if (point.forecast_confidence_upper != null) {
          row.confidence_upper = Number(point.forecast_confidence_upper) * factor;
        }
        if (point.forecast_confidence_lower != null) {
          row.confidence_lower = Number(point.forecast_confidence_lower) * factor;
        }
      }

      return row;
    });
  }, [trajectoryData?.timeline, factor, showAIPrediction]);

  return (
    <>
      <div className="fin-card p-5 flex flex-col justify-between min-h-[390px] relative overflow-hidden">
        {/* Top Header: Title + Detail View Button + Time Range selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                روند استهلاک بدهی‌ها و رشد سرمایه‌گذاری (Wealth Trajectory)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="h-3 w-3" />
                تخمین هوش مصنوعی
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مسیر کاهشی اقساط و بدهی‌ها در کنار رشد صعودی سود سرمایه‌گذاری‌ها و جریان حقوق
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            {/* Detail View Button */}
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
              title="مشاهده تک‌تک اقساط و دارایی‌ها"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>مشاهده جزئیات تفکیکی</span>
            </button>

            {/* Range selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedRange(opt.key)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedRange === opt.key
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Series Visibility Toggles & Quick Stats Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Investments toggle */}
            <button
              onClick={() => setShowInvestments(!showInvestments)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                showInvestments
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent opacity-60"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>کل سرمایه‌گذاری‌ها (صعودی)</span>
              <span className="font-bold text-[11px]" dir="ltr">
                {formatMoney(trajectoryData?.baseline_investments)}
              </span>
            </button>

            {/* Liabilities toggle */}
            <button
              onClick={() => setShowLiabilities(!showLiabilities)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                showLiabilities
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent opacity-60"
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              <span>کل بدهی‌ها و اقساط (نزولی)</span>
              <span className="font-bold text-[11px]" dir="ltr">
                {formatMoney(trajectoryData?.baseline_liabilities)}
              </span>
            </button>

            {/* Salary toggle */}
            <button
              onClick={() => setShowSalary(!showSalary)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                showSalary
                  ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent opacity-60"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>حقوق و دریافتی ماهانه</span>
              <span className="font-bold text-[11px]" dir="ltr">
                {formatMoney(trajectoryData?.baseline_salary)}
              </span>
            </button>

            {/* AI Prediction toggle */}
            <button
              onClick={() => setShowAIPrediction(!showAIPrediction)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                showAIPrediction
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent opacity-60"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>بازه تخمین آینده AI</span>
            </button>
          </div>
        </div>

        {/* Main Chart Canvas */}
        <div className="flex-1 w-full min-h-[250px] mt-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
              در حال بارگذاری شبیه‌سازی مالی هوش مصنوعی...
            </div>
          ) : formattedData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              داده‌ای جهت رسم نمودار مسیر مالی یافت نشد.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="invConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="liabAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
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

                {/* Milestone Reference Line for "امروز" */}
                <ReferenceLine
                  x="امروز"
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "امروز (شروع پیش‌بینی)",
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
                          className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-700 text-right min-w-[210px]"
                          dir="rtl"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="font-semibold text-slate-300">
                              {label} ({row?.date})
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isForecast
                                  ? "bg-purple-900/70 text-purple-300"
                                  : "bg-sky-900/70 text-sky-300"
                              }`}
                            >
                              {isForecast ? "پیش‌بینی آینده" : "تاریخچه"}
                            </span>
                          </div>

                          {showInvestments && (
                            <div className="text-emerald-400 flex items-center justify-between font-bold">
                              <span>سرمایه‌گذاری‌ها:</span>
                              <span dir="ltr">{formatMoney(row?.raw_investments)}</span>
                            </div>
                          )}

                          {showLiabilities && (
                            <div className="text-rose-400 flex items-center justify-between font-bold">
                              <span>بدهی‌ها و اقساط:</span>
                              <span dir="ltr">{formatMoney(row?.raw_liabilities)}</span>
                            </div>
                          )}

                          {showSalary && (
                            <div className="text-sky-300 flex items-center justify-between">
                              <span>حقوق ماهانه:</span>
                              <span dir="ltr">{formatMoney(row?.raw_salary)}</span>
                            </div>
                          )}

                          <div className="text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                            <span>ارزش خالص (Net Worth):</span>
                            <span className="font-bold text-sky-400" dir="ltr">
                              {formatMoney(row?.raw_nw)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* AI Confidence Band */}
                {showAIPrediction && showInvestments && (
                  <Area
                    type="monotone"
                    dataKey="confidence_upper"
                    stroke="transparent"
                    fill="url(#invConfidenceGrad)"
                  />
                )}

                {/* Total Liabilities Area & Line (Descending) */}
                {showLiabilities && (
                  <Area
                    type="monotone"
                    dataKey="total_liabilities"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fill="url(#liabAreaGrad)"
                  />
                )}

                {/* Total Investments Line (Ascending) */}
                {showInvestments && (
                  <Line
                    type="monotone"
                    dataKey="total_investments"
                    stroke="#10b981"
                    strokeWidth={2.8}
                    dot={false}
                  />
                )}

                {/* Salary Baseline Line */}
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
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom Key Milestones Strip */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              تسویه کامل بدهی‌ها:{" "}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {trajectoryData?.debt_free_date || "در مسیر کاهش"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Percent className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              سود مرکب پیش‌بینی‌شده:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold" dir="ltr">
                +{formatMoney(trajectoryData?.projected_total_profit)}
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده ریز محاسبات و جدول تفکیکی</span>
              <span aria-hidden="true">&larr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {trajectoryData && (
        <WealthTrajectoryDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          data={trajectoryData}
          selectedRange={selectedRange}
        />
      )}
    </>
  );
}
