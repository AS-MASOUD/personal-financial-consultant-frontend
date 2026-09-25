"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";

export default function AnalyticsPage() {
  const { formatMoney } = useCurrency();

  const { data: snapshots } = useQuery({
    queryKey: ["analytics-snapshots-full"],
    queryFn: () => api.getSnapshots(90),
  });

  const { data: overview } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.getOverview(),
  });

  const formattedSnapshots = React.useMemo(() => {
    if (!snapshots) return [];
    return snapshots.map((s) => ({
      date: formatDate(s.snapshot_date),
      netWorth: parseFloat(s.net_worth),
      assets: parseFloat(s.total_assets),
      liabilities: parseFloat(s.total_liabilities),
      liquid: parseFloat(s.liquid_assets),
    }));
  }, [snapshots]);

  const debtToAssetRatio = React.useMemo(() => {
    if (!overview || parseFloat(overview.total_assets) === 0) return 0;
    return (
      (parseFloat(overview.total_liabilities) / parseFloat(overview.total_assets)) *
      100
    );
  }, [overview]);

  const liquidRatio = React.useMemo(() => {
    if (!overview || parseFloat(overview.total_assets) === 0) return 0;
    return (
      (parseFloat(overview.liquid_cash) / parseFloat(overview.total_assets)) * 100
    );
  }, [overview]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          تحلیل‌های آماری و نسبت‌های سلامت مالی
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          روند انبساط ترازنامه، کفایت نقدینگی و شاخص‌های ساختار بدهی
        </p>
      </div>

      {/* Financial Health Ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fin-card p-5 border-s-4 border-s-sky-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            نسبت بدهی به دارایی
          </span>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              debtToAssetRatio > 50
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {debtToAssetRatio.toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {debtToAssetRatio < 40 ? "اهرم مالی محتاطانه و ایمن" : "اهرم مالی در حد متوسط"}
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-indigo-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            شاخص بافر نقدینگی
          </span>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-2 font-mono">
            {liquidRatio.toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            سهم نقدینگی در دسترس از کل دارایی‌ها
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-emerald-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            عمق سرمایه‌گذاری مولد
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {(100 - liquidRatio).toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            دارایی‌های زاینده با بهره مرکب
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-amber-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            سهم اقساط از درآمد (DTI)
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {overview && parseFloat(overview.monthly_income) > 0
              ? `${(
                  (parseFloat(overview.monthly_debt_service) /
                    parseFloat(overview.monthly_income)) *
                  100
                ).toFixed(1)}%`
              : "0%"}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            تعهد بازپرداخت بدهی نسبت به حقوق
          </span>
        </div>
      </div>

      {/* Dual Comparative Historical Chart */}
      <div className="fin-card p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          انبساط ترازنامه مالی (روند ۹۰ روز گذشته)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          مقایسه تاریخی کل دارایی‌ها در برابر بدهی‌ها و ارزش خالص دارایی
        </p>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedSnapshots}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val: unknown) => [formatMoney(Number(val)), ""]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#fff",
                  direction: "rtl",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="assets"
                name="کل دارایی‌ها"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                name="ارزش خالص دارایی"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="liabilities"
                name="کل بدهی‌ها"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
