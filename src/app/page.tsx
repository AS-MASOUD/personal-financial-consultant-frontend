"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Building2,
  ShieldAlert,
  PiggyBank,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/financial/metric-card";
import { AttentionBanner } from "@/components/financial/attention-banner";
import { AllocationDonut, NetWorthChart } from "@/components/financial/financial-charts";
import { formatCurrency } from "@/lib/utils";

export default function OverviewDashboardPage() {
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.getOverview(),
  });

  const { data: snapshots } = useQuery({
    queryKey: ["analytics-snapshots"],
    queryFn: () => api.getSnapshots(90),
  });

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.getGoals(),
  });

  if (isOverviewLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Metric skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="fin-card h-28 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
          ))}
        </div>
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 fin-card h-[360px] bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
          <div className="fin-card h-[360px] bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="fin-card p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Unable to Load Financial Overview
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(overviewError as Error).message || "Database connection or backend service is unreachable."}
        </p>
        <button
          onClick={() => refetchOverview()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* 1. Attention Items Banner */}
      {overview.attention_items && overview.attention_items.length > 0 && (
        <AttentionBanner items={overview.attention_items} />
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Net Worth"
          value={overview.net_worth}
          change={4.8}
          changePeriod="vs last month"
          icon={Wallet}
        />
        <MetricCard
          title="Total Assets"
          value={overview.total_assets}
          subtitle={`Invested: ${formatCurrency(overview.invested_capital)}`}
          icon={Building2}
        />
        <MetricCard
          title="Total Liabilities"
          value={overview.total_liabilities}
          subtitle={`Monthly Debt Service: ${formatCurrency(overview.monthly_debt_service)}`}
          icon={ShieldAlert}
        />
        <MetricCard
          title="Liquid Cash Buffer"
          value={overview.liquid_cash}
          subtitle="Checking, Savings & Cash"
          icon={PiggyBank}
        />
      </div>

      {/* 3. Primary Charts: Net Worth Trajectory & Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetWorthChart data={snapshots || []} />
        </div>
        <div>
          <AllocationDonut data={overview.asset_allocation || []} />
        </div>
      </div>

      {/* 4. Cash Flow Waterfall & Upcoming Obligations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Summary */}
        <div className="lg:col-span-2 fin-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Monthly Cash Flow Architecture
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Net available surplus after living expenses and debt payments
              </p>
            </div>
            <Link
              href="/cashflow"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1"
            >
              <span>Full Breakdown</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Income
              </span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(overview.monthly_income)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Expenses
              </span>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(overview.monthly_expenses)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Debt Service
              </span>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(overview.monthly_debt_service)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Free Surplus
              </span>
              <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                {formatCurrency(overview.monthly_free_cashflow)}
              </div>
            </div>
          </div>

          {/* Quick Cash Flow Progress Visualizer */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Cash Flow Utilization</span>
              <span>
                {parseFloat(overview.monthly_income) > 0
                  ? `${(
                      ((parseFloat(overview.monthly_expenses) +
                        parseFloat(overview.monthly_debt_service)) /
                        parseFloat(overview.monthly_income)) *
                      100
                    ).toFixed(1)}% of income utilized`
                  : "0%"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all"
                style={{
                  width: `${
                    parseFloat(overview.monthly_income) > 0
                      ? Math.min(
                          100,
                          (parseFloat(overview.monthly_expenses) /
                            parseFloat(overview.monthly_income)) *
                            100
                        )
                      : 0
                  }%`,
                }}
                title="Expenses"
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{
                  width: `${
                    parseFloat(overview.monthly_income) > 0
                      ? Math.min(
                          100,
                          (parseFloat(overview.monthly_debt_service) /
                            parseFloat(overview.monthly_income)) *
                            100
                        )
                      : 0
                  }%`,
                }}
                title="Debt Payments"
              />
              <div
                className="bg-emerald-500 h-full transition-all flex-1"
                title="Free Surplus"
              />
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Living Expenses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Debt Service</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Free Investable Surplus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Obligations */}
        <div className="fin-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Upcoming Obligations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Next scheduled loan & debt payments
              </p>
            </div>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-2.5 my-auto">
            {overview.upcoming_obligations && overview.upcoming_obligations.length > 0 ? (
              overview.upcoming_obligations.map((ob) => (
                <div
                  key={ob.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ob.name}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Due Day {ob.due_day} of each month
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(ob.monthly_payment)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Bal: {formatCurrency(ob.remaining_balance)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No active liabilities or debt obligations found.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href="/liabilities"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center justify-between"
            >
              <span>Manage Liabilities & Amortization</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Priority Financial Goals */}
      <div className="fin-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Active Financial Goals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Progress tracking & projected milestone achievement
            </p>
          </div>
          <Link
            href="/goals"
            className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1"
          >
            <span>All Goals</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals?.map((goal) => {
            const pct = parseFloat(goal.progress_percent) || 0;
            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {goal.name}
                    </span>
                    <span className="text-[11px] font-bold text-sky-500">
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(goal.current_amount)}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      / {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target: {goal.target_date}</span>
                    <span>+{formatCurrency(goal.monthly_contribution)}/mo</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
