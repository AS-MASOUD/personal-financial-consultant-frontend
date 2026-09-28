"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calculator,
  Building,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCurrency } from "@/components/currency-provider";

const LIABILITY_LABELS: Record<string, string> = {
  mortgage: "وام مسکن",
  auto_loan: "وام خودرو",
  student_loan: "وام تحصیلی",
  credit_card: "کارت اعتباری",
  personal_loan: "تسهیلات بانکی شخصی",
};

export default function LiabilitiesPage() {
  const [activeTab, setActiveTab] = useState<"loans" | "calculator">("loans");
  const { formatMoney } = useCurrency();

  // Calculator inputs (defaults in Toman)
  const [calcPrincipal, setCalcPrincipal] = useState("50000000");
  const [calcRate, setCalcRate] = useState("18.0");
  const [calcTerm, setCalcTerm] = useState("24");

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
            مدیریت بدهی‌ها و تعهدات مالی
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تسهیلات بانکی، وام‌های مسکن و خودرو و شبیه‌ساز استهلاک بدهی
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
            تعهدات و وام‌های فعال
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
            <span>محاسبه‌گر اقساط و استهلاک</span>
          </button>
        </div>
      </div>

      {activeTab === "loans" ? (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="fin-card p-5 border-s-4 border-s-rose-500">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                کل بدهی‌های تسویه‌نشده
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 font-mono">
                {formatMoney(totalDebt)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                در {liabilities?.length || 0} فقره بدهی و وام ثبت‌شده
              </span>
            </div>

            <div className="fin-card p-5 border-s-4 border-s-sky-500">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                تعهد پرداخت اقساط ماهانه
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
                {formatMoney(totalMonthlyCommitment)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                مجموع اقساط ثابت اصل و سود هر ماه
              </span>
            </div>

            <div className="fin-card p-5 border-s-4 border-s-amber-500">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                میانگین وزنی نرخ سود وام‌ها
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
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
                هزینه مؤثر سالانه استقراض (APR)
              </span>
            </div>
          </div>

          {/* Liabilities Cards */}
          {liabilities && liabilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liabilities.map((l) => {
                const repaidPct = parseFloat(l.repaid_percent) || 0;
                const isHighRate = parseFloat(l.interest_rate_percent) > 10;

                return (
                  <div
                    key={l.id}
                    className="fin-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-400/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {LIABILITY_LABELS[l.liability_type.toLowerCase()] || l.liability_type}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
                            isHighRate
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {parseFloat(l.interest_rate_percent).toFixed(2)}% سود سالانه
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
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {formatMoney(l.current_balance)}
                        </span>
                        <span className="text-xs text-slate-400">
                          از {formatMoney(l.original_principal)}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, repaidPct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{repaidPct.toFixed(1)}% از اصل وام تسویه شده</span>
                        <span>{formatMoney(l.repaid_amount)} پرداخت‌شده</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        تعهد قسط ماهانه:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatMoney(l.monthly_payment)} / ماه
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fin-card p-12 text-center text-slate-400 text-xs">
              هیچ بدهی یا تسهیلات بانکی فعالی برای حساب شما ثبت نشده است.
            </div>
          )}
        </>
      ) : (
        /* Amortization Calculator Engine */
        <div className="space-y-6">
          <div className="fin-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              شبیه‌ساز و پارامترهای استهلاک وام
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ اصل وام (تومان)
                </label>
                <input
                  type="number"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  نرخ سود سالانه (% APR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  مدت بازپرداخت (تعداد ماه)
                </label>
                <input
                  type="number"
                  value={calcTerm}
                  onChange={(e) => setCalcTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Schedule Table Preview */}
          <div className="fin-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  جدول تفکیک اقساط (۲۴ ماه نخست)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  مبلغ هر قسط ماهانه: {schedule && schedule[0] ? formatMoney(schedule[0].payment) : "—"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-6 font-semibold text-start">ماه</th>
                    <th className="py-2.5 px-4 font-semibold text-end">مبلغ قسط</th>
                    <th className="py-2.5 px-4 font-semibold text-end">پرداخت اصل وام</th>
                    <th className="py-2.5 px-4 font-semibold text-end">پرداخت سود</th>
                    <th className="py-2.5 px-6 font-semibold text-end">مانده بدهی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {schedule?.slice(0, 36).map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-6 font-medium text-slate-800 dark:text-slate-200 font-mono">
                        ماه {row.month}
                      </td>
                      <td className="py-2.5 px-4 text-end font-medium font-mono">
                        {formatMoney(row.payment)}
                      </td>
                      <td className="py-2.5 px-4 text-end text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                        {formatMoney(row.principal)}
                      </td>
                      <td className="py-2.5 px-4 text-end text-rose-500 font-medium font-mono">
                        {formatMoney(row.interest)}
                      </td>
                      <td className="py-2.5 px-6 text-end font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatMoney(row.remaining_balance)}
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
