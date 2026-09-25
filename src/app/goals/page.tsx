"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, Calendar, Check, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";

const CATEGORY_LABELS: Record<string, string> = {
  emergency_fund: "صندوق اضطراری",
  retirement: "بازنشستگی و استقلال مالی",
  real_estate: "خرید مسکن و ملک",
  education: "آموزش و تحصیل",
  investment: "سرمایه‌گذاری هدفمند",
  debt_payoff: "تسویه کامل بدهی",
  other: "سایر اهداف",
};

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { formatMoney } = useCurrency();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("emergency_fund");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.getGoals(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createGoal({
        name,
        category,
        target_amount: targetAmount,
        current_amount: currentAmount || "0",
        monthly_contribution: monthlyContribution || "0",
        target_date: targetDate,
        currency: "USD",
        status: "in_progress",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsAddOpen(false);
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setMonthlyContribution("");
      setTargetDate("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            اهداف مالی و برنامه‌ریزی سرمایه
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ردیابی اهداف، پس‌انداز منظم ماهانه و پیش‌بینی زمان تحقق اهداف مالی
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>هدف مالی جدید</span>
        </button>
      </div>

      {/* Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const pct = parseFloat(goal.progress_percent) || 0;
          const isCompleted = pct >= 100;

          return (
            <div
              key={goal.id}
              className="fin-card p-6 flex flex-col justify-between space-y-5 hover:border-slate-400/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {CATEGORY_LABELS[goal.category.toLowerCase()] || goal.category}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
                      isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        : "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {pct.toFixed(0)}% تکمیل شده
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-3">
                  {goal.name}
                </h3>
                {goal.notes && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {goal.notes}
                  </p>
                )}
              </div>

              {/* Progress & Target Stats */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatMoney(goal.current_amount)}
                  </span>
                  <span className="text-xs text-slate-400">
                    از {formatMoney(goal.target_amount)}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                  <span>فاصله تا هدف: {formatMoney(goal.remaining_amount)}</span>
                  <span>+{formatMoney(goal.monthly_contribution)} / ماه</span>
                </div>
              </div>

              {/* Target & Projected Timeline */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    موعد مقرر هدف:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {formatDate(goal.target_date)}
                  </span>
                </div>

                {goal.projected_completion_date && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      پیش‌بینی زمان تحقق:
                    </span>
                    <span className="font-semibold text-indigo-500 dark:text-indigo-400 font-mono">
                      {formatDate(goal.projected_completion_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ثبت هدف مالی جدید
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  عنوان هدف مالی
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً صندوق اضطراری ۶ ماهه یا پیش‌پرداخت مسکن"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  دسته‌بندی هدف
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="emergency_fund">صندوق اضطراری</option>
                  <option value="retirement">بازنشستگی و استقلال مالی</option>
                  <option value="real_estate">خرید مسکن و ملک</option>
                  <option value="education">آموزش و توسعه فردی</option>
                  <option value="investment">سرمایه‌گذاری عمومی</option>
                  <option value="debt_payoff">تسویه بدهی</option>
                  <option value="other">سایر اهداف</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ کل هدف ($ پایه)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="25000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    موجودی ذخیره‌شده فعلی ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    واریزی ماهانه ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="500"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ موعد تحقق (تارگت)
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>ثبت هدف مالی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
