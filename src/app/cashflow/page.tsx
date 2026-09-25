"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CashFlowPage() {
  const { data: summary } = useQuery({
    queryKey: ["cashflow-summary"],
    queryFn: () => api.getCashflowSummary(),
  });

  const { data: categories } = useQuery({
    queryKey: ["cashflow-categories"],
    queryFn: () => api.getCategories(),
  });

  const { data: entries } = useQuery({
    queryKey: ["cashflow-entries"],
    queryFn: () => api.getEntries(50),
  });

  const totalIncome = summary ? parseFloat(summary.total_income) : 0;
  const totalExpenses = summary ? parseFloat(summary.total_expenses) : 0;
  const netSavings = summary ? parseFloat(summary.net_savings) : 0;
  const savingsRate = summary ? parseFloat(summary.savings_rate_percent) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Cash Flow Waterfall & Budget Categories
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Income inflows, living expenses, and net surplus retention
        </p>
      </div>

      {/* Cash Flow Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Monthly Inflows
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalIncome)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Salary, dividends & capital returns
          </span>
        </div>

        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Monthly Outflows
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Living expenses & operational costs
          </span>
        </div>

        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Surplus (Savings)
          </span>
          <div
            className={`text-2xl font-bold mt-2 ${
              netSavings >= 0
                ? "text-sky-600 dark:text-sky-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(netSavings)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Available for investment & debt payoff
          </span>
        </div>

        <div className="fin-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Savings Rate
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {savingsRate.toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Percentage of income retained
          </span>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 fin-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
            Category Expense Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Spending by functional category
          </p>

          <div className="h-[280px] w-full">
            {summary?.categories_breakdown && summary.categories_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.categories_breakdown.filter((c) => c.flow_type === "expense")}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val)), "Spent"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {summary.categories_breakdown
                      .filter((c) => c.flow_type === "expense")
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No expense entries found for the period.
              </div>
            )}
          </div>
        </div>

        {/* Budgets List */}
        <div className="fin-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Budget Categories
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Configured spending categories
            </p>

            <div className="space-y-2.5 overflow-y-auto max-h-[250px] pr-1">
              {categories?.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color_hex }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {cat.flow_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cashflow Entries Table */}
      <div className="fin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recent Cashflow Line Items
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-center">Recurring</th>
                <th className="py-3 px-6 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {entries?.map((entry) => {
                const isIncome = entry.flow_type === "income";

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100">
                      {entry.description}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        {entry.category_color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.category_color }}
                          />
                        )}
                        {entry.category_name || "Uncategorized"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(entry.entry_date)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          entry.is_recurring
                            ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {entry.is_recurring ? "Recurring" : "One-off"}
                      </span>
                    </td>

                    <td className="py-3 px-6 text-right font-bold text-sm">
                      <span
                        className={
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-slate-100"
                        }
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(entry.amount)}
                      </span>
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
