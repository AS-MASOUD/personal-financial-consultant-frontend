"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { api } from "@/lib/api";
import {
  UserCircle,
  Mail,
  Smartphone,
  Briefcase,
  Calendar,
  Lock,
  Sparkles,
  Building2,
  UserCheck,
  Eye,
  Save,
  RotateCcw,
  CheckCircle2,
  KeyRound,
  FileText,
  Clock,
  Scale,
  Award,
  TrendingUp,
  Coins,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { SystemRole } from "@/types/auth";
import { FinancialOnboardingModal } from "@/components/onboarding/financial-onboarding-modal";
import { RiskAssessmentModal } from "@/components/onboarding/risk-assessment-modal";
import { CustomAllocationModal } from "@/components/financial/custom-allocation-modal";
import { calculatePortfolioAllocationCompliance } from "@/lib/allocation-utils";
import {
  normalizeDigitsToEnglish,
  isValidIranPhone,
  isValidFullName,
} from "@/lib/utils";

export default function ProfilePage() {
  const {
    user,
    updateProfile,
    refreshProfile,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const { toast } = useToast();

  // Profile Edit State
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<string>("");
  const [job, setJob] = useState("");
  const [bio, setBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals State
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showCustomAllocModal, setShowCustomAllocModal] = useState(false);

  // Fetch positions for portfolio allocation compliance check
  const { data: positions } = useQuery({
    queryKey: ["asset-positions"],
    queryFn: () => api.getPositions(),
  });

  const compliance = useMemo(() => {
    return calculatePortfolioAllocationCompliance(positions, user?.portfolio_suggestion);
  }, [positions, user?.portfolio_suggestion]);

  // Password Change State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state when user loads or updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || "");
      setEmail(user.email || "");
      setAge(
        user.age !== undefined && user.age !== null ? String(user.age) : "",
      );
      setJob(user.job || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleResetProfile = () => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || "");
      setEmail(user.email || "");
      setAge(
        user.age !== undefined && user.age !== null ? String(user.age) : "",
      );
      setJob(user.job || "");
      setBio(user.bio || "");
      toast.info("تغییرات به مقادیر قبلی بازنشانی شدند.", "بازنشانی اطلاعات");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error("نام و نام خانوادگی نمی‌تواند خالی باشد.", "فیلد الزامی");
      return;
    }

    if (!isValidFullName(cleanName)) {
      toast.error(
        "نام و نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد.",
        "خطای اعتبارسنجی نام",
      );
      return;
    }

    const cleanPhone = normalizeDigitsToEnglish(phoneNumber).trim();
    if (cleanPhone && !isValidIranPhone(cleanPhone)) {
      toast.error(
        "شماره موبایل نامعتبر است. شماره باید با 09 شروع شده و دقیقاً ۱۱ رقم باشد (مثال: 09123456789).",
        "خطای اعتبارسنجی شماره موبایل",
      );
      return;
    }

    setIsSavingProfile(true);

    try {
      const parsedAge = age.trim()
        ? parseInt(normalizeDigitsToEnglish(age).trim(), 10)
        : null;
      if (
        parsedAge !== null &&
        (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120)
      ) {
        toast.error(
          "سن وارد شده باید عددی معتبر بین ۱۰ تا ۱۲۰ سال باشد.",
          "خطای اعتبارسنجی سن",
        );
        setIsSavingProfile(false);
        return;
      }

      await updateProfile({
        full_name: cleanName,
        phone_number: cleanPhone || null,
        email: email.trim() || null,
        age: parsedAge,
        job: job.trim() || null,
        bio: bio.trim() || null,
      });

      toast.success(
        "اطلاعات پروفایل شما با موفقیت به‌روزرسانی شد.",
        "به‌روزرسانی موفق",
      );
      await refreshProfile();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "خطا در ذخیره تغییرات پروفایل.";
      toast.error(msg, "خطای ذخیره‌سازی");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("لطفاً رمز عبور فعلی را وارد نمایید.", "فیلد الزامی");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error(
        "طول رمز عبور جدید باید حداقل ۶ کاراکتر باشد.",
        "رمز عبور کوتاه",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "تکرار رمز عبور جدید با رمز عبور وارد شده همخوانی ندارد.",
        "عدم تطابق رمز عبور",
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success(
        "کلمه عبور شما با موفقیت تغییر یافت.",
        "تغییر موفق رمز عبور",
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "خطا در تغییر کلمه عبور.";
      toast.error(msg, "خطای تغییر رمز");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case "sysmanager":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>مدیر ارشد سامانه (SysManager)</span>
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
            <Building2 className="h-3.5 w-3.5" />
            <span>مدیر مالی (Admin)</span>
          </span>
        );
      case "user":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
            <UserCheck className="h-3.5 w-3.5" />
            <span>کاربر استاندارد (User)</span>
          </span>
        );
      case "viewer":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30">
            <Eye className="h-3.5 w-3.5" />
            <span>ناظر و بیننده (Viewer)</span>
          </span>
        );
    }
  };

  const getRiskLevelTitle = (level?: string | null) => {
    if (!level) return "تعیین نشده";
    if (level === "conservative" || level.includes("محافظه"))
      return "محافظه‌کارانه";
    if (level === "moderate" || level.includes("متعادل")) return "متعادل";
    if (
      level === "aggressive" ||
      level.includes("جسور") ||
      level.includes("ریسک")
    )
      return "جسورانه / ریسک‌پذیر";
    return level;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "ثبت نشده";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <span>در حال بارگذاری مشخصات حساب کاربری...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <UserCircle className="h-12 w-12 text-slate-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          لطفاً برای مشاهده پروفایل ابتدا وارد شوید
        </h2>
        <a
          href="/login"
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-md shadow-sky-600/20"
        >
          ورود به سامانه
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <UserCircle className="h-6 w-6 text-sky-500" />
          <span>پروفایل و اطلاعات کاربری</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مشاهده، تکمیل و ویرایش مشخصات شخصی، سن، شغل، اطلاعات تماس و تنظیمات
          امنیتی
        </p>
      </div>

      {/* User Hero Banner Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-950/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-sky-500/20 shrink-0">
            {user.full_name?.charAt(0) || "U"}
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-right space-y-2.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {user.full_name}
              </h2>
              {getRoleBadge(user.role)}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                حساب فعال
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
              {user.phone_number && (
                <span className="flex items-center gap-1.5 font-mono" dir="ltr">
                  <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                  {user.phone_number}
                </span>
              )}
              {user.email && (
                <span className="flex items-center gap-1.5 font-mono" dir="ltr">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {user.email}
                </span>
              )}
              {user.job && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {user.job}
                </span>
              )}
              {user.age !== null && user.age !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {user.age} سال
                </span>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-5 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                تاریخ عضویت: {formatDate(user.created_at)}
              </span>
              {user.last_login_at && (
                <span className="flex items-center gap-1">
                  آخرین ورود: {formatDate(user.last_login_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health & Risk Assessment Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Financial Profile & Job Benchmark */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    اطلاعات مالی و موقعیت شغلی
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    درآمد، پس‌انداز و شاخص مقایسه‌ای حقوق بازار
                  </p>
                </div>
              </div>
              {user.has_completed_financial_onboarding ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  تکمیل شده
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  نیازمند تکمیل
                </span>
              )}
            </div>

            {user.has_completed_financial_onboarding ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[11px] text-slate-500">
                      عنوان شغل:
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {user.job || "ثبت نشده"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[11px] text-slate-500">
                      درآمد ماهانه:
                    </span>
                    <p
                      className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono"
                      dir="ltr"
                    >
                      {Number(user.monthly_income || 0).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] font-sans text-slate-400 font-normal">
                        تومان
                      </span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[11px] text-slate-500">
                      نقدینگی و پس‌انداز:
                    </span>
                    <p
                      className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono"
                      dir="ltr"
                    >
                      {Number(user.liquid_assets || 0).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] font-sans text-slate-400 font-normal">
                        تومان
                      </span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[11px] text-slate-500">
                      سرمایه‌گذاری‌ها:
                    </span>
                    <p
                      className="font-bold text-sky-600 dark:text-sky-400 mt-0.5 font-mono"
                      dir="ltr"
                    >
                      {Number(user.investment_assets || 0).toLocaleString(
                        "en-US",
                      )}{" "}
                      <span className="text-[10px] font-sans text-slate-400 font-normal">
                        تومان
                      </span>
                    </p>
                  </div>
                </div>

                {user.financial_goals && user.financial_goals.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">
                      اهداف مالی برگزیده:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.financial_goals.map((g, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        >
                          {typeof g === "string" ? g : (g as any)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p>
                  اطلاعات مالی و شغلی شما هنوز ثبت نشده است. با ثبت این اطلاعات،
                  میانگین حقوق بازار برای حوزه کاری شما محاسبه شده و نمودارهای
                  داشبورد فعال می‌شوند.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFinancialModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Briefcase className="h-4 w-4" />
            <span>
              {user.has_completed_financial_onboarding
                ? "ویرایش اطلاعات مالی و محاسبه مجدد"
                : "تکمیل اطلاعات مالی و شغلی"}
            </span>
          </button>
        </div>

        {/* Card 2: Risk Assessment & Portfolio Allocation */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    پروفایل روانشناسی ریسک و سبد دارایی
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    سنجش ظرفیت روانی تلاطم و تخصیص بهینه سرمایه‌گذاری
                  </p>
                </div>
              </div>
              {user.has_completed_risk_onboarding ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  آزمون انجام شده
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  نیازمند ارزیابی
                </span>
              )}
            </div>

            {user.has_completed_risk_onboarding || user.portfolio_suggestion ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[11px] text-slate-500">
                      سطح ریسک‌پذیری:
                    </span>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                      {getRiskLevelTitle(user.risk_level)}
                    </p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[11px] text-slate-500">امتیاز:</span>
                    <p
                      className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5"
                      dir="ltr"
                    >
                      {user.risk_score || 0} / 100
                    </p>
                  </div>
                </div>

                {/* Target vs Actual Allocation Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      سقف تخصیص هدف پورتفوی vs موجودی فعلی:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomAllocModal(true)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>ویرایش درصدهای هدف</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {compliance.items.map((item) => {
                      const isExceeded = item.isExceeded;
                      return (
                        <div
                          key={item.key}
                          className={`p-2 rounded-xl transition-all ${
                            isExceeded
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                              : item.key === "equities"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : item.key === "gold"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : item.key === "fixed_income"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : item.key === "crypto"
                              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                              : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          <div className="text-[9px] font-bold truncate">
                            {item.label.split(" ")[0]}
                          </div>
                          <div className="text-xs font-black font-mono mt-0.5">
                            {item.targetPercent}٪
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800 pt-0.5 mt-0.5">
                            فعلی: {item.actualPercent.toFixed(0)}٪
                          </div>
                          {isExceeded && (
                            <div className="text-[8px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                              <span>تخطی</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning banner inside Card 2 if any category is exceeded */}
                  {compliance.hasExceededCategory && (
                    <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-2 mt-2 leading-relaxed">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">هشدار عدم انطباق پورتفوی با سقف ریسک:</span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                          {compliance.exceededItems.map((item) => (
                            <span key={item.key} className="block font-mono">
                              • دسته «{item.label}»: سهم فعلی ({item.actualPercent.toFixed(1)}٪) از سقف هدف ({item.targetPercent}٪) به میزان +{item.excessPercent.toFixed(1)}٪ فراتر رفته است.
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p>
                  شما هنوز در آزمون ۵ پرسشی روانشناسی ریسک شرکت نکرده‌اید. با
                  پاسخ به این پرسش‌ها، شخصیت سرمایه‌گذاری شما مشخص و درصد تخصیص
                  بهینه سهام، طلا و رمزارز پیشنهاد داده می‌شود.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowRiskModal(true)}
              className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Scale className="h-4 w-4" />
              <span>
                {user.has_completed_risk_onboarding
                  ? "شرکت مجدد در آزمون"
                  : "آزمون روانشناسی ریسک"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomAllocModal(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sliders className="h-4 w-4 text-purple-500" />
              <span>تنظیم درصدهای تخصیص</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Profile Edit & Password Change */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                <span>ویرایش مشخصات هویتی و شغلی</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فیلدهای سن، ایمیل و شغل برای شخصی‌سازی محاسبات بازنشستگی و
                گزارش‌ها استفاده می‌شوند.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    نام و نام خانوادگی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
                  />
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      maxLength={11}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = normalizeDigitsToEnglish(
                          e.target.value,
                        ).replace(/\D/g, "");
                        if (val.length <= 11) setPhoneNumber(val);
                      }}
                      placeholder="09123456789"
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all font-mono text-left"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>پست الکترونیکی (ایمیل)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      اختیاری
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all font-mono text-left"
                    />
                  </div>
                </div>

                {/* Age (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>سن</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      اختیاری (۱۰ تا ۱۲۰)
                    </span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="مثال: ۳۲"
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all font-mono text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Job / Profession */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>شغل و حوزه فعالیت حرفه‌ای</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    اختیاری
                  </span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    placeholder="مثال: مهندس نرم‌افزار / تحلیل‌گر بازار مالی / پزشک"
                    className="w-full pr-10 pl-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Bio / Financial Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>درباره من / استراتژی و اهداف سرمایه‌گذاری</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    اختیاری
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="یادداشت‌های شخصی در مورد چشم‌انداز بازنشستگی، رویکرد به ریسک و ترجیحات دارایی..."
                  className="w-full p-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>ذخیره تغییرات پروفایل</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>بازنشانی فرم</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Security & Password Change */}
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-purple-500" />
                <span>تغییر کلمه عبور</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تعیین یا به‌روزرسانی رمز عبور ثابت حساب کاربری
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  رمز عبور فعلی
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  رمز عبور جدید (حداقل ۶ کاراکتر)
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isChangingPassword ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>به‌روزرسانی رمز عبور</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Account System Info */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4 space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              اطلاعات امنیتی نشست
            </h4>
            <div className="space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>شناسه کاربری (UUID):</span>
                <span className="font-mono text-[10px]" dir="ltr">
                  {user.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>روش‌های ورود فعال:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  OTP پیامکی + رمز ثابت
                </span>
              </div>
              <div className="flex justify-between">
                <span>سطح دسترسی:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modals */}
      <FinancialOnboardingModal
        isOpen={showFinancialModal}
        onClose={() => setShowFinancialModal(false)}
        onSuccess={async () => {
          setShowFinancialModal(false);
          await refreshProfile();
          toast.success(
            "اطلاعات مالی و شغلی با موفقیت به‌روزرسانی شد.",
            "به‌روزرسانی موفق",
          );
        }}
        initialData={{
          job: user.job || "",
          monthly_income: user.monthly_income ? Number(user.monthly_income) : 0,
          liquid_assets: user.liquid_assets ? Number(user.liquid_assets) : 0,
          investment_assets: user.investment_assets
            ? Number(user.investment_assets)
            : 0,
          total_liabilities: user.total_liabilities
            ? Number(user.total_liabilities)
            : 0,
          financial_goals: user.financial_goals || [],
        }}
      />

      <RiskAssessmentModal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        onSuccess={async () => {
          setShowRiskModal(false);
          await refreshProfile();
        }}
        initialAnswers={user.risk_answers || undefined}
      />

      <CustomAllocationModal
        isOpen={showCustomAllocModal}
        onClose={() => setShowCustomAllocModal(false)}
        onSuccess={async () => {
          await refreshProfile();
        }}
      />
    </div>
  );
}
