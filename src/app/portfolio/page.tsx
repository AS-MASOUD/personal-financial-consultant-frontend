"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function PortfolioPage() {
  const [selectedClass, setSelectedClass] = useState<string>("ALL");

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
        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Holdings Value
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatCurrency(totalPortfolioValue)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Across {positions?.length || 0} active positions
          </span>
        </div>

        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Unrealized Return
          </span>
          <div
            className={`text-2xl font-bold mt-2 ${
              totalUnrealizedGain >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(totalUnrealizedGain)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Net capital gain/loss on invested cost
          </span>
        </div>

        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top Concentration
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {positions && positions[0] ? positions[0].asset_symbol : "None"}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {positions && positions[0]
              ? `${(
                  (parseFloat(positions[0].current_value) / (totalPortfolioValue || 1)) *
                  100
                ).toFixed(1)}% of portfolio weight`
              : "No positions"}
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
              {cls === "ALL" ? "All Asset Classes" : cls.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Holdings Table / Cards */}
      <div className="fin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Current Holdings & Performance
          </h3>
          <span className="text-xs text-slate-400">
            Valued at real-time market prices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6 font-semibold">Asset</th>
                <th className="py-3 px-4 font-semibold">Class</th>
                <th className="py-3 px-4 font-semibold text-right">Holdings</th>
                <th className="py-3 px-4 font-semibold text-right">Market Price</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Cost Basis</th>
                <th className="py-3 px-4 font-semibold text-right">Total Value</th>
                <th className="py-3 px-6 font-semibold text-right">Unrealized P&L</th>
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
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {pos.asset_symbol.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {pos.asset_symbol}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {pos.asset_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        {pos.asset_class}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                      {parseFloat(pos.quantity).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(pos.current_price)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {formatCurrency(pos.average_cost_basis)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(pos.current_value)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div
                        className={`inline-flex items-center gap-1 font-semibold ${
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
                        <span>{formatCurrency(pnl)}</span>
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
