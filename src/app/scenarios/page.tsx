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
import { useCurrency } from "@/components/currency-provider";

export default function ScenariosPage() {
  const { currency, exchangeRate, formatMoney } = useCurrency();
  const [horizonMonths, setHorizonMonths] = useState(36);
  const [incomeDelta, setIncomeDelta] = useState("5000000");
  const [expenseDelta, setExpenseDelta] = useState("-1000000");
  const [growthRate, setGrowthRate] = useState("25.0");
  const [newLoanAmount, setNewLoanAmount] = useState("0");
  const [newLoanRate, setNewLoanRate] = useState("18.0");
  const [newLoanTerm, setNewLoanTerm] = useState(24);
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
    const factor = currency === "USD" ? 1 / exchangeRate : 1;
    return result.monthly_projections.map((p) => {
      const rawNw = parseFloat(p.projected_net_worth) || 0;
      const rawLiq = parseFloat(p.projected_liquid_cash) || 0;
      const rawLiab = parseFloat(p.projected_liabilities) || 0;
      return {
        month: `ماه ${p.month}`,
        netWorth: rawNw * factor,
        liquid: rawLiq * factor,
        liabilities: rawLiab * factor,
        rawNetWorth: rawNw,
        rawLiquid: rawLiq,
        rawLiabilities: rawLiab,
      };
    });
  }, [result, currency, exchangeRate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            موتور شبیه‌سازی سناریوهای مالی (What-If)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            شبیه‌سازی تغییرات زندگی، تسهیلات جدید، ارتقای درآمد و بازدهی دارایی‌ها با محاسبات قطعی ریاضی
          </p>
        </div>

        <button
          onClick={() => simulateMutation.mutate()}
          disabled={simulateMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{simulateMutation.isPending ? "در حال محاسبه..." : "اجرای شبیه‌سازی"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Parameter Controls */}
        <div className="fin-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-sky-500" />
            <span>پارامترهای ورودی سناریو</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>افق زمانی شبیه‌سازی</span>
                <span className="font-bold text-sky-500 font-mono">
                  {horizonMonths} ماه ({Math.round(horizonMonths / 12)} سال)
                </span>
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
                تغییر در درآمد ماهانه (تومان)
              </label>
              <input
                type="number"
                placeholder="+10000000 یا -5000000"
                value={incomeDelta}
                onChange={(e) => setIncomeDelta(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                تغییر در هزینه ماهانه (تومان)
              </label>
              <input
                type="number"
                placeholder="-3000000 یا +4000000"
                value={expenseDelta}
                onChange={(e) => setExpenseDelta(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                بازدهی سالانه فرضی پورتفوی (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="25.0"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
                شبیه‌سازی وام و بدهی جدید
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-500 text-[11px] mb-1">
                    اصل وام (تومان)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-500 text-[11px] mb-1">
                    نرخ سود (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="18.0"
                    value={newLoanRate}
                    onChange={(e) => setNewLoanRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-500 text-[11px] mb-1">
                    مدت (ماه)
                  </label>
                  <input
                    type="number"
                    placeholder="24"
                    value={newLoanTerm}
                    onChange={(e) => setNewLoanTerm(parseInt(e.target.value) || 12)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                دریافت وجه نقد غیرمنتظره / پاداش (تومان یک‌باره)
              </label>
              <input
                type="number"
                placeholder="مثلاً 50000000"
                value={windfall}
                onChange={(e) => setWindfall(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Calculated Simulation Trajectory & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Simulation Deltas */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="fin-card p-4 border-s-4 border-s-sky-500">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  پیش‌بینی ارزش خالص نهایی
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatMoney(result.final_projected_net_worth)}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5 font-mono">
                  +{formatMoney(result.net_worth_delta)} تغییر خالص
                </span>
              </div>

              <div className="fin-card p-4 border-s-4 border-s-emerald-500">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  جریان نقدینگی ماهانه جدید
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatMoney(result.new_monthly_cashflow)}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                  در برابر {formatMoney(result.baseline_monthly_cashflow)} پایه فعلی
                </span>
              </div>

              <div className="fin-card p-4 border-s-4 border-s-rose-500">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  قسط وام جدید ماهانه
                </span>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                  {formatMoney(result.new_loan_monthly_payment)}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  تعهد بازپرداخت افزوده به اقساط
                </span>
              </div>
            </div>
          )}

          {/* Trajectory Area Chart */}
          <div className="fin-card p-5 h-[340px]">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              مسیر رشد دارایی در افق {horizonMonths} ماهه
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              محاسبه قطعی بهره مرکب ریاضی بر مبنای پارامترهای انتخابی شما
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
                    tickFormatter={(val) =>
                      currency === "USD"
                        ? `$${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val.toFixed(0)}`
                        : `${val >= 1000000 ? (val / 1000000).toFixed(0) + " م.ت" : val >= 1000 ? (val / 1000).toFixed(0) + " ه.ت" : val.toFixed(0)}`
                    }
                  />
                  <Tooltip
                    formatter={(_val: unknown, _name: any, item: any) => [
                      formatMoney(item?.payload?.rawNetWorth),
                      "ارزش خالص پیش‌بینی‌شده",
                    ]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#fff",
                      direction: "rtl",
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
