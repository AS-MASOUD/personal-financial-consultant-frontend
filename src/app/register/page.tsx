"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import {
  UserPlus,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { normalizeDigitsToEnglish, isValidIranPhone } from "@/lib/utils";

function RegisterContent() {
  const { requestRegisterOTP, registerWithOTP } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialIdentifier =
    searchParams.get("phone") || searchParams.get("identifier") || "";

  // Step state: "details" -> "otp"
  const [step, setStep] = useState<"details" | "otp">("details");

  // Form details
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP details
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
    otpCode?: string;
  }>({});
  const [shakeKey, setShakeKey] = useState(0);

  // Real-time password criteria
  const passwordCriteria = {
    length: password.length >= 8,
    letters: /[A-Za-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[^A-Za-z0-9\s]/.test(password),
  };

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const validateDetails = (): {
    cleanName: string;
    cleanPhone: string;
  } | null => {
    const cleanName = fullName.trim();
    const cleanPhone = normalizeDigitsToEnglish(phoneNumber).replace(/\D/g, "");
    const newFieldErrors: {
      fullName?: string;
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Full name validation
    if (!cleanName) {
      newFieldErrors.fullName = "لطفاً نام و نام خانوادگی را وارد فرمایید.";
    } else if (cleanName.length < 2 || cleanName.length > 50) {
      newFieldErrors.fullName = "نام و نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد.";
    }

    // Phone validation
    if (!cleanPhone) {
      newFieldErrors.phoneNumber = "لطفاً شماره موبایل خود را وارد فرمایید.";
    } else if (!isValidIranPhone(cleanPhone)) {
      newFieldErrors.phoneNumber =
        "شماره موبایل نامعتبر است. شماره باید با 09 شروع شده و ۱۱ رقم باشد (مثال: 09123456789).";
    }

    // Password validation (at least 8 chars, letters, numbers, symbols)
    const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
    if (!password) {
      newFieldErrors.password = "لطفاً یک رمز عبور تعیین فرمایید.";
    } else if (password.length < 8) {
      newFieldErrors.password = "طول رمز عبور باید حداقل ۸ کاراکتر باشد.";
    } else if (!/[A-Za-z]/.test(password)) {
      newFieldErrors.password = "رمز عبور باید شامل حروف انگلیسی (A-Z یا a-z) باشد.";
    } else if (!/\d/.test(password)) {
      newFieldErrors.password = "رمز عبور باید شامل حداقل یک عدد (0-9) باشد.";
    } else if (!/[^A-Za-z0-9\s]/.test(password)) {
      newFieldErrors.password = "رمز عبور باید شامل حداقل یک نماد یا علامت ویژه (!@#$%...) باشد.";
    } else if (!PASSWORD_REGEX.test(password)) {
      newFieldErrors.password = "رمز عبور باید حداقل ۸ کاراکتر و شامل حروف انگلیسی، عدد و نماد باشد.";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newFieldErrors.confirmPassword = "لطفاً تکرار رمز عبور را وارد فرمایید.";
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = "تکرار رمز عبور با رمز عبور اصلی مطابقت ندارد.";
    }

    // Apply errors if any
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setShakeKey((prev) => prev + 1);
      const firstMsg = Object.values(newFieldErrors)[0] as string;
      setError(firstMsg);
      toast.error(firstMsg, "خطای اعتبارسنجی");
      return null;
    }

    // No errors
    setFieldErrors({});
    setError(null);
    return { cleanName, cleanPhone };
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const valid = validateDetails();
    if (!valid) return;

    setIsLoading(true);

    try {
      const res = await requestRegisterOTP({
        full_name: valid.cleanName,
        phone_number: valid.cleanPhone,
        password: password,
      });

      setCountdown(res.cooldown_seconds || 120);
      if (res.debug_code) {
        setDebugCode(res.debug_code);
      }
      setStep("otp");
      toast.success(
        `کد تایید یکبار مصرف به شماره ${valid.cleanPhone} پیامک شد.`,
        "کد تایید ارسال شد",
      );
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string; status?: number };
      const isConflict =
        errorObj.status === 409 ||
        errorObj.code === "CONFLICT" ||
        errorObj.message?.includes("ثبت‌نام کرده است") ||
        errorObj.message?.includes("ثبت شده است");

      if (isConflict) {
        const conflictMsg =
          "کاربری با این شماره موبایل قبلاً در سامانه ثبت‌نام کرده است. لطفاً وارد شوید.";
        setError(conflictMsg);
        toast.error(conflictMsg, "حساب قبلاً وجود دارد");
      } else {
        const msg = errorObj.message || "خطا در ارسال کد تایید یکبار مصرف.";
        setError(msg);
        toast.error(msg, "خطا در ارسال کد");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valid = validateDetails();
    if (!valid) {
      setStep("details");
      return;
    }

    const cleanCode = normalizeDigitsToEnglish(otpCode).replace(/\D/g, "");
    if (!cleanCode || cleanCode.length < 5) {
      const msg = "لطفاً کد تایید ۵ رقمی را به درستی وارد فرمایید.";
      setFieldErrors({ otpCode: msg });
      setShakeKey((prev) => prev + 1);
      setError(msg);
      toast.error(msg, "کد تایید ناقص");
      return;
    }

    setIsLoading(true);

    try {
      await registerWithOTP({
        full_name: valid.cleanName,
        phone_number: valid.cleanPhone,
        password: password,
        code: cleanCode,
      });

      toast.success(
        "ثبت‌نام شما با موفقیت انجام شد. خوش آمدید!",
        "ثبت‌نام موفق",
      );
      router.push("/?onboarding=1");
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string; status?: number };
      const msg =
        errorObj.message || "کد تایید وارد شده نامعتبر است یا منقضی شده است.";
      setError(msg);
      toast.error(msg, "خطای اعتبارسنجی");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 items-center justify-center shadow-lg shadow-sky-500/25 text-white mb-2">
            {step === "details" ? (
              <UserPlus className="h-6 w-6" />
            ) : (
              <KeyRound className="h-6 w-6" />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {step === "details"
              ? "ایجاد حساب کاربری جدید"
              : "تایید شماره موبایل"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {step === "details"
              ? "مشخصات خود را جهت دریافت کد تایید وارد فرمایید"
              : `کد تایید ۵ رقمی به شماره ${phoneNumber} پیامک شد`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            {error.includes("وارد شوید") && (
              <Link
                href={`/login?identifier=${encodeURIComponent(phoneNumber)}`}
                className="underline font-bold shrink-0 hover:text-rose-700 dark:hover:text-rose-300"
              >
                ورود
              </Link>
            )}
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5">
          {step === "details" ? (
            <form noValidate onSubmit={handleRequestOTP} className="space-y-4">
              {/* Full Name Field */}
              <div key={`name-${fieldErrors.fullName ? shakeKey : 0}`} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={50}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) {
                        setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                      }
                    }}
                    placeholder="علی رضایی"
                    className={`w-full pr-10 pl-3 py-2 text-sm rounded-lg border transition-all ${
                      fieldErrors.fullName
                        ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 animate-shake"
                        : "border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    } bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.fullName}</span>
                  </div>
                )}
              </div>

              {/* Phone Number Field */}
              <div key={`phone-${fieldErrors.phoneNumber ? shakeKey : 0}`} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  شماره موبایل
                </label>
                <div className="relative">
                  <Smartphone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    maxLength={11}
                    value={phoneNumber}
                    onChange={(e) => {
                      const norm = normalizeDigitsToEnglish(
                        e.target.value,
                      ).replace(/\D/g, "");
                      if (norm.length <= 11) {
                        setPhoneNumber(norm);
                      }
                      if (fieldErrors.phoneNumber) {
                        setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                      }
                    }}
                    placeholder="09121111111"
                    dir="ltr"
                    className={`w-full pr-10 pl-3 py-2 text-sm rounded-lg border transition-all text-left font-mono ${
                      fieldErrors.phoneNumber
                        ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 animate-shake"
                        : "border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    } bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none`}
                  />
                </div>
                {fieldErrors.phoneNumber ? (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.phoneNumber}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    کد تایید پیامکی به این شماره ارسال خواهد شد.
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div key={`pass-${fieldErrors.password ? shakeKey : 0}`} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  رمز عبور (حداقل ۸ کاراکتر شامل حروف، عدد و نماد)
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full pr-10 pl-10 py-2 text-sm rounded-lg border transition-all text-left ${
                      fieldErrors.password
                        ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 animate-shake"
                        : "border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    } bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {fieldErrors.password && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </div>
                )}

                {/* Password Criteria Feedback Checklist */}
                {password.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      معیارهای امنیت رمز عبور:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div
                        className={`flex items-center gap-1.5 transition-colors ${
                          passwordCriteria.length
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <div
                          className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            passwordCriteria.length
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>حداقل ۸ کاراکتر</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 transition-colors ${
                          passwordCriteria.letters
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <div
                          className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            passwordCriteria.letters
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>حروف انگلیسی (A-Z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 transition-colors ${
                          passwordCriteria.numbers
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <div
                          className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            passwordCriteria.numbers
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>حداقل یک عدد (0-9)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 transition-colors ${
                          passwordCriteria.symbols
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <div
                          className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            passwordCriteria.symbols
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>نماد یا علامت ویژه (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div key={`confirm-${fieldErrors.confirmPassword ? shakeKey : 0}`} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full pr-10 pl-10 py-2 text-sm rounded-lg border transition-all text-left ${
                      fieldErrors.confirmPassword
                        ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 animate-shake"
                        : "border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    } bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "مخفی کردن تکرار رمز عبور" : "نمایش تکرار رمز عبور"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>دریافت کد تایید و ادامه</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification Form */
            <form noValidate onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300">
                  <Smartphone className="h-4 w-4 shrink-0 text-sky-600" />
                  <span className="font-mono dir-ltr">{phoneNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>تغییر شماره</span>
                </button>
              </div>

              <div key={`otp-${fieldErrors.otpCode ? shakeKey : 0}`} className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center block">
                  کد تایید ۵ رقمی پیامک شده را وارد فرمایید
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={5}
                    value={otpCode}
                    onChange={(e) => {
                      const clean = normalizeDigitsToEnglish(
                        e.target.value,
                      ).replace(/\D/g, "");
                      if (clean.length <= 5) {
                        setOtpCode(clean);
                      }
                      if (fieldErrors.otpCode) {
                        setFieldErrors((prev) => ({ ...prev, otpCode: undefined }));
                      }
                    }}
                    placeholder="• • • • •"
                    className={`w-full py-3.5 px-4 text-center tracking-[0.6em] text-2xl font-mono rounded-xl border transition-all ${
                      fieldErrors.otpCode
                        ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 animate-shake"
                        : "border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    } bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none`}
                  />
                </div>
                {fieldErrors.otpCode && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.otpCode}</span>
                  </div>
                )}
              </div>

              {/* Countdown / Resend */}
              <div className="text-center">
                {countdown > 0 ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>ارسال مجدد کد پس از:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleRequestOTP()}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>ارسال مجدد کد تایید</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 5}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تکمیل ثبت‌نام و ورود به سامانه</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Login footer link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <span>قبلاً حساب کاربری ساخته‌اید؟ </span>
          <Link
            href="/login"
            className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
          >
            ورود به سیستم
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-sm text-slate-400">
          در حال بارگذاری...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
