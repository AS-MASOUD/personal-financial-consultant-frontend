"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SlidersHorizontal, Play } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { ScenarioSimulationResponse } from "@/types/financial";
import { formatCurrency } from "@/lib/utils";

export default function ScenariosPage() {
  const [horizonMonths, setHorizonMonths] = useState(36);
  const [incomeDelta, setIncomeDelta] = useState("1000");
  const [expenseDelta, setExpenseDelta] = useState("-250");
  const [growthRate, setGrowthRate] = useState("7.5");
  const [newLoanAmount, setNewLoanAmount] = useState("0");
  const [newLoanRate, setNewLoanRate] = useState("6.5");
  const [newLoanTerm, setNewLoanTerm] = useState(60);
  const [windfall, setWindfall] = useState("0");

  const [result, setResult] = useState<ScenarioSimulationResponse | null>(null);

  const simulateMutation = useMutation({
    mutationFn: () =>
      api.simulateScenario({
        name: "Interactive What-If Scenario",
        horizon_months: horizonMonths,
        monthly_income_delta: incomeDelta || "0",
        monthly_expense_delta: expenseDelta || "0",
        asset_growth_rate_annual: growthRate || "7",
        new_loan_amount: newLoanAmount || "0",
        new_loan_rate_annual: newLoanRate || "6.5",
        new_loan_term_months: newLoanTerm,
        one_time_windfall: windfall || "0",
      }),
    onSuccess: (data) => {
      setResult(data);
    },
  });

  // Run initial baseline simulation on mount
  React.useEffect(() => {
    simulateMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = React.useMemo(() => {
    if (!result || !result.monthly_projections) return [];
    return result.monthly_projections.map((p) => ({
      month: `M${p.month}`,
      netWorth: parseFloat(p.projected_net_worth),
      liquid: parseFloat(p.projected_liquid_cash),
      liabilities: parseFloat(p.projected_liabilities),
    }));
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Interactive Financial Scenario Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate life changes, career moves, new loans, and market returns with deterministic precision
          </p>
        </div>

        <button
          onClick={() => simulateMutation.mutate()}
          disabled={simulateMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{simulateMutation.isPending ? "Calculating..." : "Run Simulation"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Parameter Controls */}
        <div className="fin-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-sky-500" />
            <span>Scenario Inputs</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Projection Horizon</span>
                <span className="font-bold text-sky-500">{horizonMonths} Months ({Math.round(horizonMonths / 12)} Yrs)</span>
              </div>
              <input
                type="range"
                min="12"
                max="120"
                step="6"
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monthly Income Adjustment ($)
              </label>
              <input
                type="number"
                placeholder="+1500 (promotion) or -500"
                value={incomeDelta}
                onChange={(e) => setIncomeDelta(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monthly Expense Adjustment ($)
              </label>
              <input
                type="number"
                placeholder="-300 (budget cut) or +400"
                value={expenseDelta}
                onChange={(e) => setExpenseDelta(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assumed Portfolio Annual Return (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="7.5"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Simulated New Debt / Loan
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-500 text-[11px] mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-500 text-[11px] mb-1">
                    Rate (% APR)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={newLoanRate}
                    onChange={(e) => setNewLoanRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-500 text-[11px] mb-1">
                    Term (Mos)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    value={newLoanTerm}
                    onChange={(e) => setNewLoanTerm(parseInt(e.target.value) || 12)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Immediate Windfall / Lump Sum ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 15000 (bonus, inheritance)"
                value={windfall}
                onChange={(e) => setWindfall(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Calculated Simulation Trajectory & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Simulation Deltas */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="fin-card p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Projected Net Worth
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(result.final_projected_net_worth)}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                  +{formatCurrency(result.net_worth_delta)} delta
                </span>
              </div>

              <div className="fin-card p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  New Monthly Cash Flow
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(result.new_monthly_cashflow)}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  vs {formatCurrency(result.baseline_monthly_cashflow)} baseline
                </span>
              </div>

              <div className="fin-card p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  New Loan Payment
                </span>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(result.new_loan_monthly_payment)}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  monthly debt service addition
                </span>
              </div>
            </div>
          )}

          {/* Trajectory Area Chart */}
          <div className="fin-card p-5 h-[340px]">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Projected Wealth Trajectory ({horizonMonths} Months)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Deterministic compound calculation based on selected parameters
            </p>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val)), "Projected Net Worth"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#projGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
