"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Smartphone,
  RotateCcw,
} from "lucide-react";
import { normalizeDigitsToEnglish, isValidIranPhone } from "@/lib/utils";

export default function LoginPage() {
  const { login, requestOTP, loginWithOTP } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Mode: "password" or "otp"
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  // Common identifier: Phone or Email
  const [identifier, setIdentifier] = useState("");

  // Password mode
  const [password, setPassword] = useState("");

  // OTP mode
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpChannel, setOtpChannel] = useState<string>("sms");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleUserNotFoundRedirect = (customIdentifier?: string) => {
    const rawId = (customIdentifier || identifier).trim();
    toast.error(
      "حساب کاربری با این مشخصات یافت نشد. در حال انتقال به صفحه ثبت‌نام...",
      "کاربر یافت نشد"
    );
    setError("حساب کاربری با این مشخصات یافت نشد. در حال انتقال به صفحه ثبت‌نام...");
    setTimeout(() => {
      const queryParam = rawId ? `?phone=${encodeURIComponent(rawId)}` : "";
      router.push(`/register${queryParam}`);
    }, 1200);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = normalizeDigitsToEnglish(identifier).trim();
    if (!cleanId) {
      toast.error("لطفاً شماره موبایل یا ایمیل خود را وارد نمایید.", "فیلد الزامی");
      return;
    }
    if (!cleanId.includes("@")) {
      if (!isValidIranPhone(cleanId)) {
        toast.error(
          "شماره موبایل نامعتبر است. شماره باید با 09 شروع شده و ۱۱ رقم باشد (مثال: 09123456789).",
          "شماره موبایل نامعتبر"
        );
        return;
      }
    }
    if (!password) {
      toast.error("لطفاً رمز عبور را وارد نمایید.", "فیلد الزامی");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login({ identifier: cleanId, password });
      toast.success("ورود با موفقیت انجام شد. خوش آمدید!", "ورود موفق");
      router.push("/");
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string; status?: number };
      const isNotFound =
        errorObj.code === "USER_NOT_FOUND" ||
        errorObj.status === 404 ||
        errorObj.message?.includes("یافت نشد") ||
        errorObj.message?.includes("ثبت‌نام");

      if (isNotFound) {
        handleUserNotFoundRedirect(cleanId);
      } else {
        const msg = errorObj.message || "رمز عبور وارد شده نادرست است.";
        setError(msg);
        toast.error(msg, "خطای ورود");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    const cleanId = normalizeDigitsToEnglish(identifier).trim();
    if (!cleanId) {
      const msg = "لطفاً شماره موبایل یا ایمیل خود را وارد نمایید.";
      setError(msg);
      toast.error(msg, "فیلد الزامی");
      return;
    }

    if (!cleanId.includes("@")) {
      if (!isValidIranPhone(cleanId)) {
        const msg = "شماره موبایل نامعتبر است. شماره باید با 09 شروع شده و ۱۱ رقم باشد (مثال: 09123456789).";
        setError(msg);
        toast.error(msg, "شماره موبایل نامعتبر");
        return;
      }
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await requestOTP(cleanId);
      setOtpSent(true);
      setCountdown(res.cooldown_seconds || 120);
      setOtpChannel(res.channel);
      const successText =
        res.channel === "sms"
          ? `کد یکبار مصرف پیامکی به شماره ${res.identifier} ارسال شد.`
          : `کد تایید یکبار مصرف به ایمیل ${res.identifier} ارسال شد.`;
      setSuccessMsg(successText);
      toast.success(successText, "کد تایید ارسال شد");
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string; status?: number };
      const isNotFound =
        errorObj.code === "USER_NOT_FOUND" ||
        errorObj.status === 404 ||
        errorObj.message?.includes("یافت نشد") ||
        errorObj.message?.includes("ثبت‌نام");

      if (isNotFound) {
        handleUserNotFoundRedirect(cleanId);
      } else {
        const msg = errorObj.message || "خطا در ارسال کد یکبار مصرف.";
        setError(msg);
        toast.error(msg, "خطا در ارسال کد");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = normalizeDigitsToEnglish(identifier).trim();
    const cleanCode = normalizeDigitsToEnglish(otpCode).trim();
    if (!cleanCode) {
      const msg = "لطفاً کد تایید را وارد نمایید.";
      setError(msg);
      toast.error(msg, "فیلد الزامی");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await loginWithOTP(cleanId, cleanCode);
      toast.success("ورود موفقیت‌آمیز بود. خوش آمدید!", "ورود موفق");
      router.push("/");
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string; status?: number };
      const isNotFound =
        errorObj.code === "USER_NOT_FOUND" ||
        errorObj.status === 404 ||
        errorObj.message?.includes("یافت نشد") ||
        errorObj.message?.includes("ثبت‌نام");

      if (isNotFound) {
        handleUserNotFoundRedirect(cleanId);
      } else {
        const msg = errorObj.message || "کد وارد شده نامعتبر یا منقضی شده است.";
        setError(msg);
        toast.error(msg, "خطا در اعتبارسنجی");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 items-center justify-center shadow-lg shadow-indigo-500/25 text-white mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ورود به سامانه مدیریت مالی
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ورود ایمن با شماره موبایل یا ایمیل
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "password"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>ورود با رمز عبور</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("otp");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "otp"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>ورود با کد یکبار مصرف (OTP)</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5 space-y-5">
          {/* PASSWORD MODE FORM */}
          {authMode === "password" && (
            <form noValidate onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  شماره موبایل یا ایمیل
                </label>
                <div className="relative">
                  <Smartphone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      const val = normalizeDigitsToEnglish(e.target.value);
                      if (!val.includes("@") && /^\d+$/.test(val)) {
                        if (val.length <= 11) setIdentifier(val);
                      } else {
                        setIdentifier(val);
                      }
                    }}
                    placeholder="09121111111 یا user@example.com"
                    dir="ltr"
                    className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-left font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-left"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ورود به سامانه</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP MODE FORM */}
          {authMode === "otp" && (
            <div className="space-y-4">
              {/* Step 1: Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  شماره موبایل یا ایمیل
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Smartphone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={otpSent && countdown > 0}
                      value={identifier}
                      onChange={(e) => {
                        const val = normalizeDigitsToEnglish(e.target.value);
                        if (!val.includes("@") && /^\d+$/.test(val)) {
                          if (val.length <= 11) setIdentifier(val);
                        } else {
                          setIdentifier(val);
                        }
                      }}
                      placeholder="09121111111 یا user@example.com"
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-left font-mono disabled:opacity-70"
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={isLoading || !identifier.trim()}
                      className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isLoading ? "در حال ارسال..." : "ارسال کد"}
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: OTP Verification code (Shown once sent) */}
              {otpSent && (
                <form noValidate onSubmit={handleVerifyOTP} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        کد تایید ۵ رقمی ({otpChannel === "sms" ? "پیامک‌شده" : "ایمیل‌شده"})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError(null);
                        }}
                        className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        تغییر شماره / ایمیل
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={otpCode}
                        onChange={(e) => {
                          const clean = normalizeDigitsToEnglish(e.target.value).replace(/\D/g, "");
                          if (clean.length <= 5) setOtpCode(clean);
                        }}
                        placeholder="•••••"
                        dir="ltr"
                        autoFocus
                        className="w-full pr-10 pl-3 py-2.5 text-base rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-center tracking-[0.4em] font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Resend button / Countdown */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    {countdown > 0 ? (
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        ارسال مجدد کد پس از: {formatCountdown(countdown)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
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
                        <span>تایید و ورود به سامانه</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Register footer link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <span>حساب کاربری ندارید؟ </span>
          <Link
            href="/register"
            className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
          >
            ثبت‌نام کاربر جدید
          </Link>
        </div>
      </div>
    </div>
  );
}
