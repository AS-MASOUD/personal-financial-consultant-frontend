"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calculator,
  Building,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function LiabilitiesPage() {
  const [activeTab, setActiveTab] = useState<"loans" | "calculator">("loans");

  // Calculator inputs
  const [calcPrincipal, setCalcPrincipal] = useState("250000");
  const [calcRate, setCalcRate] = useState("6.25");
  const [calcTerm, setCalcTerm] = useState("360");

  const { data: liabilities } = useQuery({
    queryKey: ["liabilities"],
    queryFn: () => api.getLiabilities(),
  });

  const { data: schedule } = useQuery({
    queryKey: ["amortization-schedule", calcPrincipal, calcRate, calcTerm],
    queryFn: () =>
      api.calculateAmortization(
        parseFloat(calcPrincipal) || 1000,
        parseFloat(calcRate) || 1,
        parseInt(calcTerm) || 12
      ),
    enabled: activeTab === "calculator" && parseFloat(calcPrincipal) > 0,
  });

  const totalDebt = React.useMemo(() => {
    if (!liabilities) return 0;
    return liabilities.reduce((sum, l) => sum + parseFloat(l.current_balance), 0);
  }, [liabilities]);

  const totalMonthlyCommitment = React.useMemo(() => {
    if (!liabilities) return 0;
    return liabilities.reduce((sum, l) => sum + parseFloat(l.monthly_payment), 0);
  }, [liabilities]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Liabilities & Debt Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mortgages, auto loans, and deterministic amortization schedules
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "loans"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Active Obligations
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "calculator"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Amortization Engine</span>
          </button>
        </div>
      </div>

      {activeTab === "loans" ? (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="fin-card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Outstanding Debt
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {formatCurrency(totalDebt)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Across {liabilities?.length || 0} loan accounts
              </span>
            </div>

            <div className="fin-card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monthly Debt Commitment
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {formatCurrency(totalMonthlyCommitment)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Fixed monthly principal & interest
              </span>
            </div>

            <div className="fin-card p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Weighted Average APR
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {liabilities && liabilities.length > 0
                  ? `${(
                      liabilities.reduce(
                        (sum, l) =>
                          sum +
                          parseFloat(l.interest_rate_percent) * parseFloat(l.current_balance),
                        0
                      ) / (totalDebt || 1)
                    ).toFixed(2)}%`
                  : "0.00%"}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Effective borrowing cost
              </span>
            </div>
          </div>

          {/* Liabilities Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liabilities?.map((l) => {
              const repaidPct = parseFloat(l.repaid_percent) || 0;
              const isHighRate = parseFloat(l.interest_rate_percent) > 10;

              return (
                <div
                  key={l.id}
                  className="fin-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-400/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {l.liability_type.replace("_", " ")}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isHighRate
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {parseFloat(l.interest_rate_percent).toFixed(2)}% APR
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-3">
                      {l.name}
                    </h3>
                    {l.lender && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3" />
                        {l.lender}
                      </span>
                    )}
                  </div>

                  {/* Balance & Repayment Progress */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(l.current_balance)}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {formatCurrency(l.original_principal)}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, repaidPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{repaidPct.toFixed(1)}% Principal Repaid</span>
                      <span>{formatCurrency(l.repaid_amount)} paid</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Payment Commitment:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(l.monthly_payment)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Amortization Calculator Engine */
        <div className="space-y-6">
          <div className="fin-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Loan Parameter Simulator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Principal Balance ($)
                </label>
                <input
                  type="number"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Annual Interest Rate (% APR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Term Length (Months)
                </label>
                <input
                  type="number"
                  value={calcTerm}
                  onChange={(e) => setCalcTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Schedule Table Preview */}
          <div className="fin-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Amortization Breakdown (First 24 Months)
                </h4>
                <p className="text-xs text-slate-400">
                  Monthly payment: {schedule && schedule[0] ? formatCurrency(schedule[0].payment) : "$0.00"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-6 font-semibold">Month</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Payment</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Principal</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Interest</th>
                    <th className="py-2.5 px-6 font-semibold text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {schedule?.slice(0, 36).map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-6 font-medium text-slate-800 dark:text-slate-200">
                        Month {row.month}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium">
                        {formatCurrency(row.payment)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(row.principal)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-rose-500 font-medium">
                        {formatCurrency(row.interest)}
                      </td>
                      <td className="py-2.5 px-6 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(row.remaining_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
