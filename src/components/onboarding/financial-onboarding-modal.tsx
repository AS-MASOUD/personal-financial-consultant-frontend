"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Briefcase,
  Wallet,
  TrendingUp,
  Shield,
  Target,
  ArrowLeft,
  X,
  CheckCircle2,
  TrendingDown,
  Building,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { normalizeDigitsToEnglish, formatEnglishNumber } from "@/lib/utils";
import {
  FinancialOnboardingInput,
  FinancialOnboardingResponse,
  JobBenchmarkResponse,
} from "@/types/auth";
import { useToast } from "@/components/toast-provider";

interface FinancialOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (res: FinancialOnboardingResponse) => void;
  initialData?: Partial<FinancialOnboardingInput>;
}

const COMMON_JOBS = [
  "برنامه‌نویس و مهندس نرم‌افزار",
  "مدیر محصول و پروژه",
  "حسابدار و کارشناس مالی",
  "تحلیل‌گر بازارهای مالی و بورس",
  "پزشک و کادر درمان",
  "مهندس عمران و معماری",
  "کارشناس بازاریابی و فروش",
  "کسب‌وکار آزاد و فروشگاهی",
  "استاد دانشگاه و معلم",
  "کارشناس اداری و منابع انسانی",
  "طراح گرافیک و رابط کاربری (UI/UX)",
  "وکالت و امور حقوقی",
];

const SUGGESTED_GOALS = [
  "خرید خانه و مسکن",
  "خرید خودرو شخصی",
  "استقلال مالی زودهنگام (FIRE)",
  "صندوق اضطراری ۶ ماهه",
  "سرمایه‌گذاری در بورس و طلا",
  "سفرهای بین‌المللی",
  "تاسیس یا توسعه کسب‌وکار شخصی",
  "صندوق پس‌انداز تحصیلی فرزندان",
  "سرمایه‌گذاری بازنشستگی مطمئن",
];

export function FinancialOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: FinancialOnboardingModalProps) {
  const { toast } = useToast();

  const [job, setJob] = useState(initialData?.job || "");
  const [customJob, setCustomJob] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState<string>(
    initialData?.monthly_income ? String(initialData.monthly_income) : ""
  );
  const [liquidAssets, setLiquidAssets] = useState<string>(
    initialData?.liquid_assets ? String(initialData.liquid_assets) : ""
  );
  const [investmentAssets, setInvestmentAssets] = useState<string>(
    initialData?.investment_assets ? String(initialData.investment_assets) : ""
  );
  const [totalLiabilities, setTotalLiabilities] = useState<string>(
    initialData?.total_liabilities ? String(initialData.total_liabilities) : ""
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialData?.financial_goals || []
  );
  const [newGoalInput, setNewGoalInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<JobBenchmarkResponse | null>(null);
  const [isQueryingBenchmark, setIsQueryingBenchmark] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setJob(initialData?.job || "");
      setMonthlyIncome(
        initialData?.monthly_income && Number(initialData.monthly_income) > 0
          ? String(initialData.monthly_income)
          : ""
      );
      setLiquidAssets(
        initialData?.liquid_assets && Number(initialData.liquid_assets) > 0
          ? String(initialData.liquid_assets)
          : ""
      );
      setInvestmentAssets(
        initialData?.investment_assets && Number(initialData.investment_assets) > 0
          ? String(initialData.investment_assets)
          : ""
      );
      setTotalLiabilities(
        initialData?.total_liabilities && Number(initialData.total_liabilities) > 0
          ? String(initialData.total_liabilities)
          : ""
      );
      setSelectedGoals(initialData?.financial_goals || []);
    }
  }, [isOpen]);

  const effectiveJob = job === "سایر" ? customJob.trim() : job.trim();

  const allGoals = React.useMemo(() => {
    return Array.from(new Set([...SUGGESTED_GOALS, ...selectedGoals]));
  }, [selectedGoals]);

  if (!isOpen) return null;

  const handleToggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleAddCustomGoal = () => {
    const clean = newGoalInput.trim();
    if (!clean) return;
    if (!selectedGoals.includes(clean)) {
      setSelectedGoals((prev) => [...prev, clean]);
    }
    setNewGoalInput("");
  };

  const handleRemoveCustomGoal = (goal: string) => {
    setSelectedGoals((prev) => prev.filter((g) => g !== goal));
  };

  const handleCheckBenchmark = async () => {
    if (!effectiveJob) {
      toast.warning("لطفاً ابتدا عنوان شغلی را انتخاب یا وارد نمایید.", "شغل نامشخص");
      return;
    }
    const cleanSalary = normalizeDigitsToEnglish(monthlyIncome).replace(/\D/g, "");
    const salaryNum = parseFloat(cleanSalary) || 0;
    if (salaryNum <= 0) {
      toast.warning("لطفاً مبلغ درآمد ماهیانه را وارد نمایید.", "درآمد نامشخص");
      return;
    }

    setIsQueryingBenchmark(true);
    try {
      const bm = await api.getJobBenchmark(effectiveJob, salaryNum);
      setBenchmarkResult(bm);
      toast.info("شاخص میانگین دستمزد و تحلیل بازار استعلام شد.", "تحلیل درآمد");
    } catch {
      toast.error("خطا در استعلام شاخص میانگین شغلی.", "خطای استعلام");
    } finally {
      setIsQueryingBenchmark(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveJob) {
      toast.error("لطفاً عنوان شغلی خود را مشخص فرمایید.", "فیلد الزامی");
      return;
    }

    const incomeVal = parseFloat(normalizeDigitsToEnglish(monthlyIncome).replace(/\D/g, "")) || 0;
    const liquidVal = parseFloat(normalizeDigitsToEnglish(liquidAssets).replace(/\D/g, "")) || 0;
    const investVal = parseFloat(normalizeDigitsToEnglish(investmentAssets).replace(/\D/g, "")) || 0;
    const liabVal = parseFloat(normalizeDigitsToEnglish(totalLiabilities).replace(/\D/g, "")) || 0;

    setIsSubmitting(true);
    try {
      const response = await api.submitFinancialOnboarding({
        job: effectiveJob,
        monthly_income: incomeVal,
        liquid_assets: liquidVal,
        investment_assets: investVal,
        total_liabilities: liabVal,
        financial_goals: selectedGoals,
      });

      toast.success("اطلاعات مالی و شغلی شما با موفقیت ثبت شد.", "ثبت موفق");
      setBenchmarkResult(response.benchmark);
      if (onSuccess) {
        onSuccess(response);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ثبت اطلاعات مالی.";
      toast.error(msg, "خطای ثبت");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTomanDisplay = (numStr: string) => {
    return formatEnglishNumber(numStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>تکمیل پروفایل مالی و موقعیت شغلی</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  گام ۱ از ۲
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                محاسبه میانگین درآمد شغلی، مقایسه با بازار و پیشنهادهای رشد ثروت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن / رد کردن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <form id="financial-onboarding-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Job and Income Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-sky-500" />
                  <span>عنوان شغل یا تخصص</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={COMMON_JOBS.includes(job) ? job : job ? "سایر" : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "سایر") {
                      setJob("سایر");
                    } else {
                      setJob(val);
                      setCustomJob("");
                    }
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="">-- انتخاب شغل یا رده شغلی --</option>
                  {COMMON_JOBS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                  <option value="سایر">سایر مشاغل (تایپ دستی)...</option>
                </select>

                {(job === "سایر" || (!COMMON_JOBS.includes(job) && job !== "")) && (
                  <input
                    type="text"
                    placeholder="عنوان دقیق شغل خود را وارد نمایید..."
                    value={customJob || (COMMON_JOBS.includes(job) ? "" : job)}
                    onChange={(e) => setCustomJob(e.target.value)}
                    className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                )}
              </div>

              {/* Monthly Income */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                    <span>درآمد خالص ماهانه (تومان)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCheckBenchmark}
                    disabled={isQueryingBenchmark || !effectiveJob}
                    className="text-[11px] text-sky-600 hover:text-sky-500 dark:text-sky-400 font-medium cursor-pointer disabled:opacity-40"
                  >
                    {isQueryingBenchmark ? "در حال محاسبه..." : "بررسی میانگین بازار"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={formatTomanDisplay(monthlyIncome)}
                    onChange={(e) => {
                      const norm = normalizeDigitsToEnglish(e.target.value);
                      setMonthlyIncome(norm.replace(/\D/g, ""));
                    }}
                    className="w-full pl-12 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-mono tracking-wide"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-slate-400 pointer-events-none">
                    تومان
                  </span>
                </div>
              </div>
            </div>

            {/* Assets & Liabilities Grid */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-indigo-500" />
                <span>وضعیت ترازنامه و دارایی‌های فعلی</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Liquid Assets */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>نقدینگی و پس‌انداز</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatTomanDisplay(liquidAssets)}
                      onChange={(e) => {
                        const norm = normalizeDigitsToEnglish(e.target.value);
                        setLiquidAssets(norm.replace(/\D/g, ""));
                      }}
                      className="w-full pl-10 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                      dir="ltr"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-400 pointer-events-none">
                      تومان
                    </span>
                  </div>
                </div>

                {/* Investment Assets */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>سرمایه‌گذاری‌ها (طلا، سهام، رمزارز)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatTomanDisplay(investmentAssets)}
                      onChange={(e) => {
                        const norm = normalizeDigitsToEnglish(e.target.value);
                        setInvestmentAssets(norm.replace(/\D/g, ""));
                      }}
                      className="w-full pl-10 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                      dir="ltr"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-400 pointer-events-none">
                      تومان
                    </span>
                  </div>
                </div>

                {/* Total Liabilities */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>بدهی‌ها و تعهدات اقساط</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatTomanDisplay(totalLiabilities)}
                      onChange={(e) => {
                        const norm = normalizeDigitsToEnglish(e.target.value);
                        setTotalLiabilities(norm.replace(/\D/g, ""));
                      }}
                      className="w-full pl-10 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                      dir="ltr"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-400 pointer-events-none">
                      تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Goals Chips */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-purple-500" />
                <span>اهداف مالی و برنامه‌های آتی</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (انتخاب یک یا چند مورد)
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {allGoals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  const isCustom = !SUGGESTED_GOALS.includes(goal);
                  return (
                    <div
                      key={goal}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-sm shadow-purple-600/25"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleGoal(goal)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                        <span>{goal}</span>
                        {isCustom && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-normal ${
                              isSelected
                                ? "bg-purple-700/80 text-purple-100"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            اختصاصی
                          </span>
                        )}
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomGoal(goal);
                          }}
                          className={`p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer mr-0.5 ${
                            isSelected
                              ? "text-purple-100 hover:text-white"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          }`}
                          title="حذف این هدف اختصاصی"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add custom goal */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="هدف اختصاصی دیگری دارید؟ تایپ کنید..."
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomGoal();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <button
                  type="button"
                  onClick={handleAddCustomGoal}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  افزودن
                </button>
              </div>
            </div>

            {/* Benchmark Feedback Display (if queried or calculated) */}
            {benchmarkResult && (
              <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-900/40 pb-2">
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-sky-600" />
                    <span>تحلیل مقایسه‌ای درآمد شغلی: {benchmarkResult.job_category}</span>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-600/10 text-sky-700 dark:text-sky-300">
                    {benchmarkResult.status_fa}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">حقوق شما</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono" dir="ltr">
                      {Number(benchmarkResult.user_salary_toman).toLocaleString("en-US")}{" "}
                      <span className="text-[9px] font-sans text-slate-400 font-normal">تومان</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">میانگین بازار</div>
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5 font-mono" dir="ltr">
                      {Number(benchmarkResult.average_salary_toman).toLocaleString("en-US")}{" "}
                      <span className="text-[9px] font-sans text-slate-400 font-normal">تومان</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">بازه متعارف بازار</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 font-mono" dir="ltr">
                      {Number(benchmarkResult.min_salary_toman).toLocaleString("en-US")} -{" "}
                      {Number(benchmarkResult.max_salary_toman).toLocaleString("en-US")}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">نسبت به میانگین</div>
                    <div
                      className={`text-xs font-bold mt-0.5 flex items-center justify-center gap-0.5 font-mono ${
                        benchmarkResult.comparison_ratio_percent >= 100
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                      dir="ltr"
                    >
                      {benchmarkResult.comparison_ratio_percent >= 100 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{benchmarkResult.comparison_ratio_percent}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100/50 dark:border-sky-900/30 leading-relaxed">
                  💡 <span className="font-semibold">پیشنهاد هوشمند:</span>{" "}
                  {benchmarkResult.suggestion_fa}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            رد کردن (بعداً در پروفایل تکمیل می‌کنم)
          </button>

          <button
            type="submit"
            form="financial-onboarding-form"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>ثبت و ادامه به سنجش ریسک‌پذیری</span>
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
