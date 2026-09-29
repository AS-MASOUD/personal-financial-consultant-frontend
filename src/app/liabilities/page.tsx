"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Building,
  Plus,
  Trash2,
  Users,
  CreditCard,
  CheckCircle2,
  Calendar,
  Percent,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  X,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCurrency } from "@/components/currency-provider";
import { useUserPlatforms } from "@/hooks/use-user-platforms";
import { LiabilityDetailModal } from "@/components/financial/liability-detail-modal";
import { LenderLogo } from "@/components/financial/lender-logo";
import { Liability } from "@/types/financial";

const ICON_MAP: Record<string, React.ElementType> = {
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Users,
  AlertCircle,
  GraduationCap,
};

const DEFAULT_LIABILITY_TYPES = [
  {
    id: "bank_loan",
    label: "وام بانکی",
    description: "تسهیلات بانکی با نرخ سود مصوب یا توافقی",
    icon: Building,
    defaultRate: "18.0",
    defaultTerm: "24",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "friend_borrowed",
    label: "قرض گرفتن از دوست / آشنا",
    description: "بدهی من به دیگری (سود ۰٪ قرض‌الحسنه)",
    icon: ArrowDownLeft,
    defaultRate: "0.0",
    defaultTerm: "3",
    isFriend: true,
    direction: "debt",
  },
  {
    id: "friend_lent",
    label: "قرض دادن به دوست / آشنا",
    description: "طلب من از دیگری / مطالبات مالی (سود ۰٪)",
    icon: ArrowUpRight,
    defaultRate: "0.0",
    defaultTerm: "3",
    isFriend: true,
    direction: "claim",
  },
  {
    id: "bnpl",
    label: "خرید اقساطی پلتفرمی (BNPL)",
    description: "اقساط اسنپ‌پی، دیجی‌پی، ازکی‌وام، تارا و ...",
    icon: CreditCard,
    defaultRate: "0.0",
    defaultTerm: "4",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "personal_loan",
    label: "وام شخصی / صندوق خانوادگی",
    description: "صندوق‌های وام خانگی و قرض‌الحسنه کارمندی",
    icon: Users,
    defaultRate: "4.0",
    defaultTerm: "12",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "mortgage",
    label: "وام مسکن",
    description: "تسهیلات خرید یا ودیعه مسکن و جعاله",
    icon: Building,
    defaultRate: "23.0",
    defaultTerm: "60",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "auto_loan",
    label: "وام خودرو",
    description: "تسهیلات لیزینگ یا خرید خودرو",
    icon: CreditCard,
    defaultRate: "23.0",
    defaultTerm: "36",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "student_loan",
    label: "وام تحصیلی",
    description: "تسهیلات دانشجویی و صندوق رفاه دانشجویان",
    icon: GraduationCap,
    defaultRate: "4.0",
    defaultTerm: "36",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "credit_card",
    label: "کارت اعتباری",
    description: "اعتبار کارت بانکی با دوره تنفس یا بازپرداخت اقساطی",
    icon: CreditCard,
    defaultRate: "18.0",
    defaultTerm: "12",
    isFriend: false,
    direction: "debt",
  },
  {
    id: "other",
    label: "سایر بدهی‌ها و تعهدات",
    description: "چک‌های صادره، بدهی بازار، تعهدات غیربانکی",
    icon: AlertCircle,
    defaultRate: "0.0",
    defaultTerm: "6",
    isFriend: false,
    direction: "debt",
  },
];

const DEFAULT_LIABILITY_LABELS: Record<string, string> = {
  bank_loan: "وام بانکی",
  personal_loan: "وام شخصی / صندوق",
  friend_borrowed: "قرض گرفته‌شده از دوست (بدهی)",
  friend_lent: "قرض داده‌شده به دوست (طلب)",
  bnpl: "خرید اقساطی پلتفرمی",
  mortgage: "وام مسکن",
  auto_loan: "وام خودرو",
  student_loan: "وام تحصیلی",
  credit_card: "کارت اعتباری",
  other: "سایر تعهدات",
};

export default function LiabilitiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"loans" | "new_liability" | "calculator">("loans");
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);
  const { formatMoney } = useCurrency();
  const { platforms } = useUserPlatforms();

  // Load liability types from backend database table
  const { data: backendLiabilityTypes } = useQuery({
    queryKey: ["liability-types"],
    queryFn: () => api.getLiabilityTypes(),
  });

  const liabilityTypes = useMemo(() => {
    if (!backendLiabilityTypes || backendLiabilityTypes.length === 0) {
      return DEFAULT_LIABILITY_TYPES;
    }
    return backendLiabilityTypes.map((t) => ({
      id: t.code,
      label: t.label,
      description: t.description || "",
      icon: ICON_MAP[t.icon] || Building,
      defaultRate: String(t.default_rate),
      defaultTerm: String(t.default_term_months),
      isFriend: t.is_friend,
      direction: t.direction,
    }));
  }, [backendLiabilityTypes]);

  const liabilityLabels = useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_LIABILITY_LABELS };
    if (backendLiabilityTypes) {
      backendLiabilityTypes.forEach((t) => {
        map[t.code.toLowerCase()] = t.short_label || t.label;
      });
    }
    return map;
  }, [backendLiabilityTypes]);

  // New Liability Form State
  const [name, setName] = useState("");
  const [liabilityType, setLiabilityType] = useState("bank_loan");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [customLender, setCustomLender] = useState("");
  const [isCustomLender, setIsCustomLender] = useState(false);
  const [originalPrincipal, setOriginalPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("18.0");
  const [termMonths, setTermMonths] = useState("24");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Amortization Calculator inputs
  const [calcPrincipal, setCalcPrincipal] = useState("50000000");
  const [calcRate, setCalcRate] = useState("18.0");
  const [calcTerm, setCalcTerm] = useState("24");

  const { data: liabilities, isLoading } = useQuery({
    queryKey: ["liabilities"],
    queryFn: () => api.getLiabilities(),
  });

  const activeSelectedLiability = useMemo(() => {
    if (!selectedLiability || !liabilities) return selectedLiability;
    return liabilities.find((l) => l.id === selectedLiability.id) || selectedLiability;
  }, [selectedLiability, liabilities]);

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

  // Calculate monthly payment automatically whenever principal, rate, or term change
  const autoMonthlyPayment = useMemo(() => {
    const p = parseFloat(originalPrincipal);
    const r = parseFloat(interestRate);
    const n = parseInt(termMonths);

    if (isNaN(p) || p <= 0 || isNaN(n) || n <= 0) return "";

    if (isNaN(r) || r <= 0) {
      return Math.round(p / n).toString();
    }

    // Amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyRate = r / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, n);
    const payment = (p * (monthlyRate * factor)) / (factor - 1);
    return Math.round(payment).toString();
  }, [originalPrincipal, interestRate, termMonths]);

  // Handle changing liability type to prefill defaults
  const handleTypeChange = (typeId: string) => {
    setLiabilityType(typeId);
    const cfg = liabilityTypes.find((t) => t.id === typeId);
    if (cfg) {
      setInterestRate(cfg.defaultRate);
      setTermMonths(cfg.defaultTerm);
      if (cfg.isFriend) {
        setIsCustomLender(true);
      }
    }
  };

  // Create Liability Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (!name.trim()) throw new Error("لطفاً عنوان یا نام وام / بدهی را وارد کنید.");
      const p = parseFloat(originalPrincipal);
      if (isNaN(p) || p <= 0) throw new Error("لطفاً مبلغ اصل بدهی یا وام را به تومان وارد کنید.");

      const lenderName = isCustomLender
        ? customLender.trim()
        : selectedPlatform || (platforms.length > 0 ? platforms[0] : "بانک");

      if (!lenderName) throw new Error("لطفاً نام بانک، پلتفرم یا شخص طرف حساب را مشخص کنید.");

      const finalRate = parseFloat(interestRate) || 0;
      const finalTerm = parseInt(termMonths) || 12;
      const finalPayment = monthlyPayment ? parseFloat(monthlyPayment) : parseFloat(autoMonthlyPayment) || 0;

      const payload = {
        name: name.trim(),
        liability_type: liabilityType,
        lender: lenderName,
        original_principal: p,
        current_balance: p,
        interest_rate_percent: finalRate,
        term_months: finalTerm,
        monthly_payment: finalPayment,
        start_date: startDate,
        currency: "TOMAN",
        notes: notes.trim() || undefined,
      };

      return api.createLiability(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      // Reset form
      setName("");
      setOriginalPrincipal("");
      setMonthlyPayment("");
      setCustomLender("");
      setNotes("");
      setIsModalOpen(false);
      setActiveTab("loans");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در ثبت وام یا بدهی";
      setFormError(msg);
    },
  });

  // Delete Liability Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
    },
  });

  // Aggregated Metrics
  const { totalDebts, totalClaims, totalMonthlyCommitment, avgRate } = useMemo(() => {
    if (!liabilities) return { totalDebts: 0, totalClaims: 0, totalMonthlyCommitment: 0, avgRate: 0 };

    let debts = 0;
    let claims = 0;
    let monthly = 0;
    let weightedRateSum = 0;

    liabilities.forEach((l) => {
      const bal = parseFloat(l.current_balance) || 0;
      const pay = parseFloat(l.monthly_payment) || 0;
      const rate = parseFloat(l.interest_rate_percent) || 0;

      if (l.liability_type === "friend_lent") {
        claims += bal;
      } else {
        debts += bal;
        monthly += pay;
        weightedRateSum += rate * bal;
      }
    });

    const avg = debts > 0 ? (weightedRateSum / debts) : 0;
    return {
      totalDebts: debts,
      totalClaims: claims,
      totalMonthlyCommitment: monthly,
      avgRate: avg,
    };
  }, [liabilities]);

  // Filtered List
  const filteredLiabilities = useMemo(() => {
    if (!liabilities) return [];
    if (filterType === "all") return liabilities;
    if (filterType === "bank") return liabilities.filter((l) => l.liability_type === "bank_loan" || l.liability_type === "mortgage" || l.liability_type === "auto_loan");
    if (filterType === "friend") return liabilities.filter((l) => l.liability_type === "friend_borrowed" || l.liability_type === "friend_lent");
    if (filterType === "bnpl") return liabilities.filter((l) => l.liability_type === "bnpl");
    return liabilities;
  }, [liabilities, filterType]);

  const selectedTypeConfig = liabilityTypes.find((t) => t.id === liabilityType);

  // Form Component for reusability (used in both Tab 2 and Modal)
  const renderLiabilityForm = (isInsideModal = false) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate();
      }}
      className="space-y-4 text-xs"
    >
      {formError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
          {formError}
        </div>
      )}

      {/* Select Type with descriptive visual cards */}
      <div>
        <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          نوع تعهد یا استقراض
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {liabilityTypes.map((t) => {
            const Icon = t.icon;
            const isSelected = liabilityType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`p-2.5 rounded-xl border text-start transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 ring-2 ring-sky-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isSelected ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  {t.isFriend && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      سود ۰٪
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {t.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {t.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
          عنوان یا شرح وام / بدهی
        </label>
        <input
          type="text"
          placeholder={
            liabilityType === "friend_borrowed"
              ? "مثلاً قرض از علی بابت رهن آپارتمان"
              : liabilityType === "friend_lent"
              ? "مثلاً قرض به رضا بابت راه‌اندازی کار"
              : liabilityType === "bnpl"
              ? "مثلاً خرید اقساطی گوشی از اسنپ‌پی"
              : "مثلاً تسهیلات طرح امید بانک ملت"
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
        />
      </div>

      {/* Counterparty / Bank / Platform / Friend */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-medium text-slate-700 dark:text-slate-300">
            {selectedTypeConfig?.isFriend
              ? liabilityType === "friend_borrowed"
                ? "نام دوست / قرض‌دهنده (طرف حساب)"
                : "نام دوست / قرض‌گیرنده (طرف حساب)"
              : "بانک، پلتفرم یا ارائه‌دهنده تسهیلات"}
          </label>
          <button
            type="button"
            onClick={() => setIsCustomLender(!isCustomLender)}
            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
          >
            {isCustomLender ? "انتخاب از لیست پلتفرم‌ها" : "+ ورود نام شخص یا نام سفارشی"}
          </button>
        </div>

        {isCustomLender ? (
          <input
            type="text"
            placeholder={
              selectedTypeConfig?.isFriend
                ? "مثلاً محمد حسینی، دوست دوران دانشگاه"
                : "مثلاً بانک پاسارگاد، صندوق ثامن"
            }
            value={customLender}
            onChange={(e) => setCustomLender(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        ) : (
          <select
            value={selectedPlatform || (platforms.length > 0 ? platforms[0] : "")}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Amount (Original Principal) */}
      <div>
        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
          مبلغ اصل وام یا بدهی / قرض (تومان)
        </label>
        <input
          type="number"
          step="any"
          placeholder="مثلاً 50,000,000"
          value={originalPrincipal}
          onChange={(e) => setOriginalPrincipal(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono text-sm"
        />
        {originalPrincipal && !isNaN(parseFloat(originalPrincipal)) && (
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            معادل: {parseFloat(originalPrincipal).toLocaleString()} تومان
          </span>
        )}
      </div>

      {/* Rate & Time (Term) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 text-slate-400" />
              <span>نرخ سود سالانه (% APR)</span>
            </label>
            {selectedTypeConfig?.isFriend && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                قرض دوستانه (بدون سود)
              </span>
            )}
          </div>
          <input
            type="number"
            step="0.1"
            placeholder="0"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono"
          />
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {[
              { label: "۰٪ قرض‌الحسنه", val: "0" },
              { label: "۴٪ کارمزد", val: "4" },
              { label: "۱۸٪ بانکی", val: "18" },
              { label: "۲۳٪ آزاد", val: "23" },
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                onClick={() => setInterestRate(chip.val)}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time / Term Months */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>مدت بازپرداخت (تعداد ماه‌ها / اقساط)</span>
          </label>
          <input
            type="number"
            min="1"
            max="600"
            placeholder="مثلاً 24"
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono"
          />
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {[
              { label: "۱ ماه", val: "1" },
              { label: "۳ ماه", val: "3" },
              { label: "۶ ماه", val: "6" },
              { label: "۱۲ ماه", val: "12" },
              { label: "۲۴ ماه", val: "24" },
              { label: "۳۶ ماه", val: "36" },
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                onClick={() => setTermMonths(chip.val)}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Payment (Auto-calculated with manual override option) */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center justify-between mb-1">
          <label className="font-semibold text-slate-800 dark:text-slate-200">
            مبلغ قسط ماهانه (تومان)
          </label>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-mono">
            {autoMonthlyPayment ? `محاسبه خودکار: ${parseFloat(autoMonthlyPayment).toLocaleString()} تومان` : "—"}
          </span>
        </div>
        <input
          type="number"
          step="any"
          placeholder={autoMonthlyPayment || "0"}
          value={monthlyPayment}
          onChange={(e) => setMonthlyPayment(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono text-sm"
        />
        <span className="text-[10px] text-slate-400 mt-1 block">
          اگر خالی بگذارید، مقدار محاسبه‌شده خودکار ({parseFloat(autoMonthlyPayment || "0").toLocaleString()} تومان) ثبت خواهد شد.
        </span>
      </div>

      {/* Start Date & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>تاریخ شروع / دریافت وام یا قرض</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            توضیحات و یادداشت (اختیاری)
          </label>
          <input
            type="text"
            placeholder="مثلاً شماره چک، ضامن، تاریخ سررسید توافقی..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex justify-end gap-2">
        {isInsideModal && (
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            انصراف
          </button>
        )}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>در حال ثبت...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>ثبت نهایی وام / بدهی</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            مدیریت بدهی‌ها، وام‌ها و قرض‌ها
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تسهیلات بانکی، خریدهای اقساطی پلتفرمی و قرض گرفتن/دادن به دوستان
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ثبت بدهی / وام جدید</span>
          </button>

          {/* Navigation Tabs */}
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
              onClick={() => setActiveTab("new_liability")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                activeTab === "new_liability"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Plus className="h-3 w-3" />
              <span>ثبت جدید</span>
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
              <span>محاسبه‌گر اقساط</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Active Liabilities List */}
      {activeTab === "loans" && (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fin-card p-5 border-s-4 border-s-rose-500">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                کل بدهی‌های من (وام و قرض)
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 font-mono">
                {formatMoney(totalDebts)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                تعهدات مالی، وام‌های بانکی و قرض‌های گرفته‌شده
              </span>
            </div>

            <div className="fin-card p-5 border-s-4 border-s-emerald-500">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                کل مطالبات من (قرض به دوستان)
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                {formatMoney(totalClaims)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                مبالغی که به دیگران قرض داده‌اید و باید پس بگیرید
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
                میانگین وزنی نرخ سود
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
                {avgRate.toFixed(2)}%
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                هزینه مؤثر استقراض سالانه (APR)
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 pl-2">فیلتر:</span>
            {[
              { id: "all", label: "همه موارد" },
              { id: "bank", label: "وام‌های بانکی" },
              { id: "friend", label: "قرض‌های دوستانه (گرفته شده / داده شده)" },
              { id: "bnpl", label: "خریدهای اقساطی (BNPL)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterType === f.id
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Liabilities Cards Grid */}
          {isLoading ? (
            <div className="fin-card p-12 text-center text-slate-400 text-xs">
              در حال دریافت لیست تعهدات مالی...
            </div>
          ) : filteredLiabilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLiabilities.map((l) => {
                const repaidPct = parseFloat(l.repaid_percent) || 0;
                const rate = parseFloat(l.interest_rate_percent) || 0;
                const isFriendLent = l.liability_type === "friend_lent";
                const isFriendBorrowed = l.liability_type === "friend_borrowed";

                const origPrincipal = parseFloat(l.original_principal) || 0;
                const currBalance = parseFloat(l.current_balance) || 0;
                const monthlyPay = parseFloat(l.monthly_payment) || 0;
                const repaidAmt = Math.max(0, origPrincipal - currBalance);

                let totalMonths = 0;
                if (l.start_date && l.maturity_date) {
                  const s = new Date(l.start_date);
                  const m = new Date(l.maturity_date);
                  const diffMs = m.getTime() - s.getTime();
                  if (diffMs > 0) {
                    totalMonths = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
                  }
                }
                if (totalMonths <= 0 && monthlyPay > 0 && origPrincipal > 0) {
                  totalMonths = Math.max(1, Math.round(origPrincipal / monthlyPay));
                }
                const paidMonths = totalMonths > 0 ? Math.min(totalMonths, Math.round((repaidAmt / (origPrincipal || 1)) * totalMonths)) : 0;
                const remainMonths = totalMonths > 0 ? Math.max(0, totalMonths - paidMonths) : (monthlyPay > 0 ? Math.ceil(currBalance / monthlyPay) : 0);

                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLiability(l)}
                    className={`fin-card p-5 flex flex-col justify-between space-y-4 hover:border-sky-500/50 hover:shadow-md cursor-pointer transition-all relative group ${
                      isFriendLent
                        ? "border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10"
                        : isFriendBorrowed
                        ? "border-amber-500/40 bg-amber-50/10 dark:bg-amber-950/10"
                        : ""
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isFriendLent
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : isFriendBorrowed
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {isFriendLent && <ArrowUpRight className="h-3 w-3" />}
                          {isFriendBorrowed && <ArrowDownLeft className="h-3 w-3" />}
                          {liabilityLabels[l.liability_type.toLowerCase()] || l.liability_type}
                        </span>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
                            rate === 0
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                              : rate > 15
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {rate === 0 ? "بدون سود (۰٪)" : `${rate.toFixed(1)}% سود`}
                        </span>
                      </div>

                      {/* Bank Logo / Emblem & Title */}
                      <div className="flex items-center gap-3">
                        <LenderLogo lender={l.lender} liabilityType={l.liability_type} size="md" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {l.name}
                          </h3>
                          {l.lender ? (
                            <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                              طرف حساب: <b className="text-slate-600 dark:text-slate-300 font-semibold">{l.lender}</b>
                            </span>
                          ) : (
                            <span className="text-[10px] text-sky-500 font-medium block mt-0.5">
                              + برای جزییات کلیک کنید...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Balance & Progress */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between font-mono">
                        <div>
                          <span className="text-xs text-slate-400 block font-sans">
                            {isFriendLent ? "مانده طلب شما:" : "مانده بدهی:"}
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              isFriendLent
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {formatMoney(l.current_balance)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          از اصل {formatMoney(l.original_principal)}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFriendLent ? "bg-emerald-500" : "bg-sky-500"
                          }`}
                          style={{ width: `${Math.min(100, repaidPct)}%` }}
                        />
                      </div>

                      {/* Installment count & summary */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{repaidPct.toFixed(1)}% تسویه شده</span>
                        {totalMonths > 0 ? (
                          <span>
                            {paidMonths} از {totalMonths} قسط
                          </span>
                        ) : (
                          <span>{formatMoney(l.repaid_amount)} پرداخت‌شده</span>
                        )}
                      </div>
                    </div>

                    {/* Footer with Monthly Payment and Delete Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          {isFriendLent ? "دریافت ماهانه توافقی:" : "تعهد قسط ماهانه:"}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatMoney(l.monthly_payment)} / ماه
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium group-hover:underline">
                          مشاهده جزییات ←
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`آیا از حذف یا تسویه کامل «${l.name}» مطمئن هستید؟`)) {
                              deleteMutation.mutate(l.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="تسویه و حذف این تعهد"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fin-card p-12 text-center text-slate-400 text-xs space-y-3">
              <p>هیچ تعهد مالی، وام یا قرضی در این دسته‌بندی ثبت نشده است.</p>
              <button
                onClick={() => setActiveTab("new_liability")}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ثبت اولین وام، بدهی یا قرض</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Tab 2: New Liability Direct Form */}
      {activeTab === "new_liability" && (
        <div className="fin-card p-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              ثبت وام، بدهی یا قرض جدید
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مشخصات تسهیلات، قرض‌های دوستانه یا خریدهای اقساطی خود را ثبت و اقساط آن را رصد کنید.
            </p>
          </div>
          {renderLiabilityForm(false)}
        </div>
      )}

      {/* Tab 3: Amortization Calculator Engine */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <div className="fin-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              شبیه‌ساز و پارامترهای استهلاک وام و محاسبه اقساط
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

      {/* Quick Add Liability Modal (Accessible from any tab via the top button) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="fin-card w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ثبت بدهی، وام یا قرض جدید
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ثبت تسهیلات بانکی، خرید اقساطی پلتفرمی یا قرض دوستانه
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderLiabilityForm(true)}
          </div>
        </div>
      )}

      {/* Liability Entity Detail & Edit Modal */}
      <LiabilityDetailModal
        liability={activeSelectedLiability}
        isOpen={!!selectedLiability}
        onClose={() => setSelectedLiability(null)}
        liabilityTypes={liabilityTypes}
        liabilityLabels={liabilityLabels}
      />
    </div>
  );
}
