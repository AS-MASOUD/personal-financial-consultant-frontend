"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, Calendar, Check, X, Loader2, Trash2, Target, AlertCircle } from "lucide-react";
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
  vehicle: "خرید خودرو",
  business: "کسب‌وکار شخصی",
  personal: "هدف شخصی",
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
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.getGoals(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (!name.trim()) throw new Error("لطفاً عنوان هدف مالی را وارد کنید.");
      const p = parseFloat(targetAmount);
      if (isNaN(p) || p <= 0) throw new Error("مبلغ هدف باید بزرگتر از صفر باشد.");

      const payload = {
        name: name.trim(),
        category,
        target_amount: p,
        current_amount: parseFloat(currentAmount) || 0,
        monthly_contribution: parseFloat(monthlyContribution) || 0,
        target_date: targetDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
        currency: "TOMAN",
        status: "in_progress",
        notes: notes.trim() || undefined,
      };

      return api.createGoal(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsAddOpen(false);
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setMonthlyContribution("");
      setNotes("");
      setFormError(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در ثبت هدف مالی";
      setFormError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-sky-500" />
            <span>اهداف مالی و برنامه‌ریزی سرمایه</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ردیابی اهداف، پس‌انداز منظم ماهانه و پیش‌بینی زمان تحقق اهداف مالی
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>هدف مالی جدید</span>
        </button>
      </div>

      {/* Goals Cards */}
      {isLoading ? (
        <div className="fin-card p-12 text-center text-slate-400 text-xs">
          در حال بارگذاری اهداف مالی...
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = parseFloat(goal.progress_percent) || 0;
            const isCompleted = pct >= 100;
            const targetNum = parseFloat(goal.target_amount) || 0;

            return (
              <div
                key={goal.id}
                className="fin-card p-6 flex flex-col justify-between space-y-5 hover:border-slate-400/50 transition-colors relative"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {CATEGORY_LABELS[goal.category?.toLowerCase()] || goal.category || "هدف مالی"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
                          isCompleted
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                            : "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        {pct.toFixed(0)}% تکمیل شده
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`آیا از حذف هدف «${goal.name}» مطمئن هستید؟`)) {
                            deleteMutation.mutate(goal.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="حذف هدف"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                      از {targetNum > 0 ? formatMoney(goal.target_amount) : "نامشخص"}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
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
                      {goal.target_date ? formatDate(goal.target_date) : "—"}
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
      ) : (
        <div className="fin-card p-12 text-center text-slate-400 text-xs space-y-3">
          <p>هنوز هدف مالی ثبت نکرده‌اید. با کلیک بر روی دکمه «هدف مالی جدید» می‌توانید پس‌انداز هدفمند خود را آغاز کنید.</p>
          <button
            onClick={() => {
              setFormError(null);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ثبت اولین هدف مالی</span>
          </button>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
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

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

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
                  placeholder="مثلاً صندوق اضطراری، پیش‌پرداخت مسکن، خرید خودرو"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  دسته‌بندی هدف
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="emergency_fund">صندوق اضطراری</option>
                  <option value="retirement">بازنشستگی و استقلال مالی</option>
                  <option value="real_estate">خرید مسکن و ملک</option>
                  <option value="vehicle">خرید خودرو</option>
                  <option value="education">آموزش و توسعه فردی</option>
                  <option value="business">کسب‌وکار شخصی</option>
                  <option value="investment">سرمایه‌گذاری هدفمند</option>
                  <option value="debt_payoff">تسویه بدهی</option>
                  <option value="other">سایر اهداف</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ کل هدف (تومان)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="مثلاً 100,000,000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono text-sm"
                />
                {targetAmount && !isNaN(parseFloat(targetAmount)) && (
                  <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                    معادل: {parseFloat(targetAmount).toLocaleString()} تومان
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    موجودی فعلی (تومان)
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

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    واریزی ماهانه (تومان)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="مثلاً 5,000,000"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
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

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="توضیحات تکمیلی..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
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
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>ثبت هدف مالی</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
