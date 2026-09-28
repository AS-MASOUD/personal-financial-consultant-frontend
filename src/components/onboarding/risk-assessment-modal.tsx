"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  PieChart,
  HelpCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  Coins,
  DollarSign,
  Scale,
  Flame,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { RiskAssessmentResult, RiskOnboardingResponse } from "@/types/auth";
import { useToast } from "@/components/toast-provider";

interface RiskAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (res: RiskOnboardingResponse) => void;
  initialAnswers?: Record<string, number>;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: {
    points: number;
    title: string;
    description: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1_drawdown_reaction",
    title: "۱. واکنش روانی شما در افت ۲۰ درصدی ارزش کل سبد سرمایه‌گذاری چیست؟",
    subtitle: "این پرسش ظرفیت تحمل افت روانی و کنترل هیجان در بازارهای پرتلاطم را می‌سنجد.",
    options: [
      {
        points: 5,
        title: "نگرانی شدید و نقد کردن سریع دارایی‌ها",
        description: "تحمل ضرر را ندارم و بلافاصله برای جلوگیری از ضرر بیشتر، همه چیز را می‌فروشم.",
      },
      {
        points: 10,
        title: "نگرانی قابل توجه اما صبر و عدم فروش",
        description: "مضطرب می‌شوم اما از فروش شتاب‌زده پرهیز کرده و منتظر برگشت بازار می‌مانم.",
      },
      {
        points: 15,
        title: "حفظ خونسردی و نظاره روند میان‌مدت",
        description: "نوسان را بخشی طبیعی از بازار می‌دانم و بدون اضطراب به استراتژی خود پایبندم.",
      },
      {
        points: 20,
        title: "خرید مازاد و استفاده هیجان‌انگیز از تخفیف قیمت‌ها",
        description: "ریزش را فرصت طلایی خرید ارزان می‌دانم و نقدینگی مازاد را وارد بازار می‌کنم.",
      },
    ],
  },
  {
    id: "q2_horizon",
    title: "۲. افق زمانی مورد انتظار شما برای بخش اصلی سرمایه‌گذاری چقدر است؟",
    subtitle: "طول زمان در دسترس اجازه مهار نوسانات کوتاه‌مدت و بهره‌مندی از سود مرکب را می‌دهد.",
    options: [
      {
        points: 5,
        title: "کمتر از ۶ ماه تا ۱ سال",
        description: "به نقدینگی خود در کوتاه‌مدت برای مخارج ضروری زندگی نیاز خواهم داشت.",
      },
      {
        points: 10,
        title: "بین ۱ تا ۳ سال",
        description: "میان‌مدت محتاطانه برای اهداف مشخص مانند خرید خودرو یا سفر.",
      },
      {
        points: 15,
        title: "بین ۳ تا ۵ سال",
        description: "زمان کافی برای گذر از دوره‌های رکود و دستیابی به سود مطلوب.",
      },
      {
        points: 20,
        title: "بیش از ۵ تا ۱۰ سال (بلندمدت)",
        description: "دیدگاه بلندمدت برای ساخت ثروت چشمگیر و عدم نیاز به برداشت سرمایه.",
      },
    ],
  },
  {
    id: "q3_return_vs_safety",
    title: "۳. در توازن بین «امنیت اصل سرمایه» و «پتانسیل سود حداکثری»، کدام را ترجیح می‌دهید؟",
    subtitle: "سودهای فراتر از تورم همواره مستلزم پذیرش ریسک نوسان اصل سرمایه هستند.",
    options: [
      {
        points: 5,
        title: "حفظ ۱۰۰٪ اصل سرمایه در اولویت مطلق است",
        description: "حتی اگر بازدهی کمتر از نرخ تورم باشد، حفظ ارزش اسمی برایم حیاتی است.",
      },
      {
        points: 10,
        title: "بازدهی پایدار با ریسک حداقلی",
        description: "سودی معادل یا کمی بالاتر از سپرده‌های بانکی بدون افت محسوس سرمایه.",
      },
      {
        points: 15,
        title: "تعادل هوشمند بین بازدهی بالاتر و مهار ریسک",
        description: "پذیرش نوسانات کنترل‌شده در ازای رشد واقعی سرمایه بالاتر از تورم.",
      },
      {
        points: 20,
        title: "بیشترین بازدهی ممکن با پذیرش نوسانات شدید",
        description: "حاضرم افت‌های مقطعی بزرگ را برای دستیابی به جهش‌های مالی بزرگ تحمل کنم.",
      },
    ],
  },
  {
    id: "q4_experience",
    title: "۴. دانش و تجربه عملی شما در بازارهای مالی (بورس، طلا، رمزارز، فارکس) چقدر است؟",
    subtitle: "میزان تسلط تحلیلی و سابقه معامله‌گری مانع از تصمیمات احساسی در تلاطم‌ها می‌شود.",
    options: [
      {
        points: 5,
        title: "مبتدی و بدون سابقه فعالیت قبلی",
        description: "شناخت زیادی از سازوکار بازارها ندارم و به دنبال ابزارهای بدون دردسر هستم.",
      },
      {
        points: 10,
        title: "آشنایی مقدماتی با مفاهیم و اصطلاحات",
        description: "تجربه اندکی در سپرده‌گذاری و صندوق‌ها دارم اما به صورت فعال ترید نمی‌کنم.",
      },
      {
        points: 15,
        title: "تجربه متوسط و آشنایی با تحلیل‌ها",
        description: "چند سال است در بازارها حضور دارم و با تحلیل پایه و مدیریت سبد آشنا هستم.",
      },
      {
        points: 20,
        title: "سرمایه‌گذار حرفه‌ای و فعال",
        description: "تسلط کامل بر روانشناسی بازار، مدیریت ریسک، ابزارهای مشتقه و تحلیل تکنیکال/فاندامنتال.",
      },
    ],
  },
  {
    id: "q5_income_stability",
    title: "۵. ثبات جریان درآمدی ماهیانه و امنیت شغلی شما در چه سطحی است؟",
    subtitle: "جریان ورودی نقدینگی پایدار، امکان ریسک‌پذیری بالاتر بر روی سرمایه‌گذاری‌ها را فراهم می‌کند.",
    options: [
      {
        points: 5,
        title: "متغیر و ناپایدار",
        description: "درآمدم از ماه به ماه به شدت نوسان دارد یا ذخیره اضطراری کافی ندارم.",
      },
      {
        points: 10,
        title: "نسبتاً پایدار با ریسک مقطعی",
        description: "درآمد دارم اما گاهی با تاخیر یا کسری مواجه می‌شوم.",
      },
      {
        points: 15,
        title: "پایدار، مستمر و با اطمینان",
        description: "قرارداد شغلی مطمئن یا کسب‌وکار پایدار با درآمد ماهانه قابل پیش‌بینی دارم.",
      },
      {
        points: 20,
        title: "بسیار قوی با چندین منبع درآمدی مازاد",
        description: "درآمد ماهیانه من به مراتب فراتر از هزینه‌هاست و جریان نقدینگی قدرتمندی دارم.",
      },
    ],
  },
];

export function RiskAssessmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialAnswers,
}: RiskAssessmentModalProps) {
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      return initialAnswers;
    }
    // Default sensible defaults (15 for moderate)
    return {
      q1_drawdown_reaction: 15,
      q2_horizon: 15,
      q3_return_vs_safety: 15,
      q4_experience: 10,
      q5_income_stability: 15,
    };
  });

  React.useEffect(() => {
    if (isOpen && initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
  }, [isOpen, initialAnswers]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentScore = Object.values(answers).reduce((sum, p) => sum + p, 0);

  // Compute live estimation
  let estimatedLevel = "متعادل";
  let estimatedBadgeClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
  let estimatedSuggestion = {
    equities: 35,
    gold: 20,
    fixed_income: 25,
    crypto: 5,
    cash: 15,
  };

  if (currentScore <= 45) {
    estimatedLevel = "محافظه‌کارانه";
    estimatedBadgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    estimatedSuggestion = {
      equities: 15,
      gold: 25,
      fixed_income: 45,
      crypto: 0,
      cash: 15,
    };
  } else if (currentScore > 75) {
    estimatedLevel = "جسورانه / ریسک‌پذیر";
    estimatedBadgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    estimatedSuggestion = {
      equities: 50,
      gold: 15,
      fixed_income: 10,
      crypto: 15,
      cash: 10,
    };
  }

  const handleSelectOption = (qId: string, points: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: points,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify all 5 questions answered
    const requiredKeys = [
      "q1_drawdown_reaction",
      "q2_horizon",
      "q3_return_vs_safety",
      "q4_experience",
      "q5_income_stability",
    ];

    for (const k of requiredKeys) {
      if (!answers[k]) {
        toast.warning("لطفاً به تمامی ۵ پرسش پاسخ دهید.", "پرسش بی‌پاسخ");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitRiskOnboarding({
        answers,
      });

      toast.success(
        `پروفایل ریسک ${response.risk_result.risk_title_fa} با امتیاز ${response.risk_result.total_score} ثبت شد!`,
        "ثبت موفق"
      );

      if (onSuccess) {
        onSuccess(response);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ثبت آزمون سنجش ریسک.";
      toast.error(msg, "خطای ثبت");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>سنجش روانشناسی ریسک‌پذیری مالی</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  گام ۲ از ۲
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                شناسایی شخصیت سرمایه‌گذاری و تنظیم تخصیص بهینه دارایی‌ها بر اساس ظرفیت روانی و مالی شما
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

        {/* Live Score & Allocation Ribbon */}
        <div className="bg-slate-100/70 dark:bg-slate-950/60 px-6 py-3 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              امتیاز ریسک لحظه‌ای:
            </div>
            <div className="flex items-center gap-1.5 font-mono text-base font-bold text-purple-600 dark:text-purple-400">
              <span>{currentScore}</span>
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${estimatedBadgeClass}`}
            >
              {estimatedLevel}
            </span>
          </div>

          {/* Allocation preview bar */}
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${estimatedSuggestion.equities}%` }}
                className="bg-blue-500 h-full"
                title={`سهام: ${estimatedSuggestion.equities}%`}
              />
              <div
                style={{ width: `${estimatedSuggestion.gold}%` }}
                className="bg-amber-400 h-full"
                title={`طلا: ${estimatedSuggestion.gold}%`}
              />
              <div
                style={{ width: `${estimatedSuggestion.fixed_income}%` }}
                className="bg-emerald-500 h-full"
                title={`درآمد ثابت: ${estimatedSuggestion.fixed_income}%`}
              />
              <div
                style={{ width: `${estimatedSuggestion.crypto}%` }}
                className="bg-violet-500 h-full"
                title={`رمزارز: ${estimatedSuggestion.crypto}%`}
              />
              <div
                style={{ width: `${estimatedSuggestion.cash}%` }}
                className="bg-slate-400 h-full"
                title={`نقدینگی: ${estimatedSuggestion.cash}%`}
              />
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              سبد بهینه
            </span>
          </div>
        </div>

        {/* Modal Body / Questions */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          <form id="risk-assessment-form" onSubmit={handleSubmit} className="space-y-8">
            {QUESTIONS.map((q) => {
              const selectedPoints = answers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {q.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {q.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt) => {
                      const isChosen = selectedPoints === opt.points;
                      return (
                        <button
                          key={opt.points}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.points)}
                          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                            isChosen
                              ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/20 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold leading-snug">
                              {opt.title}
                            </span>
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                isChosen
                                  ? "border-purple-600 bg-purple-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isChosen && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            {opt.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Allocation Strategy Preview Card */}
            <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  <span>تخصیص پیشنهادی بر اساس سبک شما: {estimatedLevel}</span>
                </span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                  تطابق با مدل‌های ریسک و بازده مدرن
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/50 dark:border-blue-900/30">
                  <div className="text-[10px] text-blue-600 font-semibold">سهام و بورس</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono" dir="ltr">
                    {estimatedSuggestion.equities}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-900/30">
                  <div className="text-[10px] text-amber-600 font-semibold">طلا و مسکوکات</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono" dir="ltr">
                    {estimatedSuggestion.gold}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/50 dark:border-emerald-900/30">
                  <div className="text-[10px] text-emerald-600 font-semibold">صندوق‌های درآمد ثابت</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono" dir="ltr">
                    {estimatedSuggestion.fixed_income}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-200/50 dark:border-violet-900/30">
                  <div className="text-[10px] text-violet-600 font-semibold">رمزارز و دیجیتال</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono" dir="ltr">
                    {estimatedSuggestion.crypto}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">نقدینگی و سپرده</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono" dir="ltr">
                    {estimatedSuggestion.cash}%
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
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
            form="risk-assessment-form"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Award className="h-4 w-4" />
                <span>ثبت در پروفایل و مشاهده سبد پیشنهادی</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
