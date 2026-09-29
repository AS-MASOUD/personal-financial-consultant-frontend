"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Building2,
  ShieldAlert,
  PiggyBank,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/financial/metric-card";
import { AttentionBanner } from "@/components/financial/attention-banner";
import { AllocationDonut } from "@/components/financial/financial-charts";
import { WealthTrajectoryChart } from "@/components/financial/wealth-trajectory-chart";
import { useCurrency } from "@/components/currency-provider";
import { useAuth } from "@/components/auth-provider";
import { FinancialOnboardingModal } from "@/components/onboarding/financial-onboarding-modal";
import { RiskAssessmentModal } from "@/components/onboarding/risk-assessment-modal";

export default function OverviewDashboardPage() {
  const { formatMoney } = useCurrency();
  const { user, refreshProfile } = useAuth();

  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
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

  // Check if user was redirected from register or needs onboarding
  useEffect(() => {
    if (typeof window === "undefined" || !user || hasCheckedOnboarding) return;

    const params = new URLSearchParams(window.location.search);
    const isOnboardingFlag = params.get("onboarding") === "1";

    if (isOnboardingFlag || !user.has_completed_financial_onboarding) {
      setShowFinancialModal(true);
      setHasCheckedOnboarding(true);
    }
  }, [user, hasCheckedOnboarding]);

  const handleFinancialSuccess = async () => {
    setShowFinancialModal(false);
    await refreshProfile();
    await refetchOverview();
    // Proceed to Step 2: Risk Assessment Modal
    setShowRiskModal(true);
  };

  const handleRiskSuccess = async () => {
    setShowRiskModal(false);
    await refreshProfile();
    await refetchOverview();
  };

  return (
    <>
      {isOverviewLoading ? (
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
      ) : overviewError ? (
        <div className="fin-card p-8 text-center max-w-lg mx-auto my-12 space-y-4">
          <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            خطا در دریافت اطلاعات مالی
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {(overviewError as Error).message || "ارتباط با پایگاه‌داده یا سرویس بک‌اند برقرار نشد."}
          </p>
          <button
            onClick={() => refetchOverview()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      ) : overview ? (
        <div className="space-y-6">
      {/* Onboarding Guidance Banners */}
      {user && user.role !== "sysmanager" && !user.has_completed_financial_onboarding && (
        <div className="p-4 sm:p-5 rounded-2xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 via-indigo-50 to-white dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                حساب شما آماده است! اطلاعات مالی و شغلی خود را ثبت کنید
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                با تکمیل درآمد شغلی و آزمون روانشناسی ریسک، کارت‌ها و نمودارهای تحلیل ثروت شما بر اساس دارایی‌هایتان فعال می‌شوند.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFinancialModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>تکمیل اطلاعات و سنجش ریسک</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {user && user.role !== "sysmanager" && user.has_completed_financial_onboarding && !user.has_completed_risk_onboarding && (
        <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-indigo-50 to-white dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                آزمون روانشناسی ریسک‌پذیری تکمیل نشده است
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                با پاسخ به ۵ پرسش، سطح ریسک و ترکیب سبد دارایی‌های پیشنهادی شما تعیین می‌شود.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRiskModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>شرکت در آزمون سنجش ریسک</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. Attention Items Banner */}
      {overview.attention_items && overview.attention_items.length > 0 && (
        <AttentionBanner items={overview.attention_items} />
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="ارزش خالص کل (Net Worth)"
          value={overview.net_worth}
          change={4.8}
          changePeriod="نسبت به ماه گذشته"
          icon={Wallet}
        />
        <MetricCard
          title="مجموع دارایی‌ها"
          value={overview.total_assets}
          subtitle={`سرمایه‌گذاری شده: ${formatMoney(overview.invested_capital)}`}
          icon={Building2}
        />
        <MetricCard
          title="مجموع بدهی‌ها و وام‌ها"
          value={overview.total_liabilities}
          subtitle={`اقساط ماهانه: ${formatMoney(overview.monthly_debt_service)}`}
          icon={ShieldAlert}
        />
        <MetricCard
          title="نقدینگی در دسترس"
          value={overview.liquid_cash}
          subtitle="حساب‌های جاری، پس‌انداز و نقد"
          icon={PiggyBank}
        />
      </div>

      {/* 3. Primary Charts: Wealth Trajectory & Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WealthTrajectoryChart />
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
                معماری جریان نقدینگی ماهانه
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مازاد خالص نقدینگی پس از کسر هزینه‌های جاری زندگی و اقساط وام‌ها
              </p>
            </div>
            <Link
              href="/cashflow"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1"
            >
              <span>مشاهده تفکیک کامل</span>
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                کل درآمدها
              </span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatMoney(overview.monthly_income)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                کل مخارج
              </span>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatMoney(overview.monthly_expenses)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                اقساط وام‌ها
              </span>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatMoney(overview.monthly_debt_service)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                پس‌انداز مازاد
              </span>
              <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                {formatMoney(overview.monthly_free_cashflow)}
              </div>
            </div>
          </div>

          {/* Quick Cash Flow Progress Visualizer */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>نرخ بهره‌برداری از درآمد</span>
              <span>
                {parseFloat(overview.monthly_income) > 0
                  ? `${(
                      ((parseFloat(overview.monthly_expenses) +
                        parseFloat(overview.monthly_debt_service)) /
                        parseFloat(overview.monthly_income)) *
                      100
                    ).toFixed(1)}% از درآمد مصرف شده`
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
                title="مخارج"
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
                title="اقساط بدهی"
              />
              <div
                className="bg-emerald-500 h-full transition-all flex-1"
                title="پس‌انداز مازاد"
              />
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>هزینه‌های زندگی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>اقساط بدهی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>مازاد آزاد قابل سرمایه‌گذاری</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Obligations */}
        <div className="fin-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                تعهدات و سررسیدهای پیش‌رو
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اقساط و پرداخت‌های آتی تسهیلات
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
                      سررسید روز {ob.due_day} هر ماه
                    </span>
                  </div>
                  <div className="text-left" dir="ltr">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(ob.monthly_payment)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      مانده: {formatMoney(ob.remaining_balance)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                تعهد بدهی یا اقساط فعالی ثبت نشده است.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href="/liabilities"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center justify-between"
            >
              <span>مدیریت تسهیلات و استهلاک وام</span>
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Priority Financial Goals */}
      <div className="fin-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              اهداف مالی و پس‌انداز فعال
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              رصد پیشرفت و زمان‌بندی دستیابی به اهداف
            </p>
          </div>
          <Link
            href="/goals"
            className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1"
          >
            <span>مشاهده همه اهداف</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {goals && goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map((goal) => {
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
                      <span className="text-[11px] font-bold text-sky-500 font-mono" dir="ltr">
                        {pct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100 font-mono" dir="ltr">
                      {formatMoney(goal.current_amount)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / {formatMoney(goal.target_amount)}
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
                      <span>موعد هدف: {goal.target_date}</span>
                      <span dir="ltr">+{formatMoney(goal.monthly_contribution)}/ماه</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            هنوز هدف مالی فعالی ثبت نشده است. از بخش اهداف مالی می‌توانید نخستین هدف خود را تعریف کنید.
          </div>
        )}
      </div>
    </div>
  ) : null}

  {/* Onboarding Modals */}
  <FinancialOnboardingModal
    isOpen={showFinancialModal}
    onClose={() => setShowFinancialModal(false)}
    onSuccess={handleFinancialSuccess}
    initialData={
      user
        ? {
            job: user.job || "",
            monthly_income: user.monthly_income ? Number(user.monthly_income) : 0,
            liquid_assets: user.liquid_assets ? Number(user.liquid_assets) : 0,
            investment_assets: user.investment_assets ? Number(user.investment_assets) : 0,
            total_liabilities: user.total_liabilities ? Number(user.total_liabilities) : 0,
            financial_goals: user.financial_goals || [],
          }
        : undefined
    }
  />

  <RiskAssessmentModal
    isOpen={showRiskModal}
    onClose={() => setShowRiskModal(false)}
    onSuccess={handleRiskSuccess}
    initialAnswers={user?.risk_answers || undefined}
  />
</>
);
}
