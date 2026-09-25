"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";

const CLASS_LABELS: Record<string, string> = {
  ALL: "همه دارایی‌ها",
  EQUITY: "سهام و ETF",
  CRYPTO: "ارزهای دیجیتال",
  COMMODITY: "طلا و کالاها",
  FIXED_INCOME: "درآمد ثابت و اوراق",
};

export default function PortfolioPage() {
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const { formatMoney } = useCurrency();

  const { data: positions, isLoading } = useQuery({
    queryKey: ["asset-positions"],
    queryFn: () => api.getPositions(),
  });

  const filteredPositions = React.useMemo(() => {
    if (!positions) return [];
    if (selectedClass === "ALL") return positions;
    return positions.filter(
      (p) => p.asset_class.toLowerCase() === selectedClass.toLowerCase()
    );
  }, [positions, selectedClass]);

  const totalPortfolioValue = React.useMemo(() => {
    if (!positions) return 0;
    return positions.reduce((sum, p) => sum + parseFloat(p.current_value), 0);
  }, [positions]);

  const totalUnrealizedGain = React.useMemo(() => {
    if (!positions) return 0;
    return positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pnl), 0);
  }, [positions]);

  const assetClasses = ["ALL", "EQUITY", "CRYPTO", "COMMODITY", "FIXED_INCOME"];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="fin-card h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="fin-card h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fin-card p-5 border-s-4 border-s-sky-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ارزش کل دارایی‌ها
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {formatMoney(totalPortfolioValue)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            در {positions?.length || 0} موقعیت فعال سرمایه‌گذاری
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-emerald-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            کل سود / زیان تحقق‌نیافته
          </span>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              totalUnrealizedGain >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatMoney(totalUnrealizedGain)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            سود/زیان دفتری خالص نسبت به بهای تمام‌شده
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-indigo-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            بیشترین تمرکز دارایی
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {positions && positions[0] ? positions[0].asset_symbol : "—"}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {positions && positions[0]
              ? `${(
                  (parseFloat(positions[0].current_value) / (totalPortfolioValue || 1)) *
                  100
                ).toFixed(1)}% از ارزش کل پورتفوی`
              : "موقعیتی ثبت نشده است"}
          </span>
        </div>
      </div>

      {/* Asset Class Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          {assetClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedClass === cls
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {CLASS_LABELS[cls] || cls}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Holdings Table */}
      <div className="fin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            ترکیب و عملکرد دارایی‌های پورتفوی
          </h3>
          <span className="text-xs text-slate-400">
            ارزش‌گذاری بر مبنای نرخ‌های لحظه‌ای بازار
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6 font-semibold text-start">دارایی / نماد</th>
                <th className="py-3 px-4 font-semibold text-start">دسته‌بندی</th>
                <th className="py-3 px-4 font-semibold text-end">تعداد / موجودی</th>
                <th className="py-3 px-4 font-semibold text-end">قیمت لحظه‌ای</th>
                <th className="py-3 px-4 font-semibold text-end">میانگین بهای خرید</th>
                <th className="py-3 px-4 font-semibold text-end">ارزش روز</th>
                <th className="py-3 px-6 font-semibold text-end">سود / زیان دفتری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPositions.map((pos) => {
                const pnl = parseFloat(pos.unrealized_pnl);
                const pnlPct = parseFloat(pos.unrealized_pnl_percent);
                const isPositive = pnl >= 0;

                return (
                  <tr
                    key={pos.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                          {pos.asset_symbol.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block font-mono">
                            {pos.asset_symbol}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {pos.asset_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-start">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {CLASS_LABELS[pos.asset_class.toUpperCase()] || pos.asset_class}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-end font-medium text-slate-800 dark:text-slate-200 font-mono">
                      {parseFloat(pos.quantity).toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-end font-medium text-slate-800 dark:text-slate-200 font-mono">
                      {formatMoney(pos.current_price)}
                    </td>

                    <td className="py-3.5 px-4 text-end text-slate-500 font-mono">
                      {formatMoney(pos.average_cost_basis)}
                    </td>

                    <td className="py-3.5 px-4 text-end font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatMoney(pos.current_value)}
                    </td>

                    <td className="py-3.5 px-6 text-end">
                      <div
                        className={`inline-flex items-center gap-1 font-semibold font-mono ${
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{formatMoney(pnl)}</span>
                        <span className="text-[11px]">({formatPercent(pnlPct)})</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
