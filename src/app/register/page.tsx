"use client";

import React, { useState, Suspense } from "react";
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
} from "lucide-react";

function RegisterContent() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialIdentifier = searchParams.get("phone") || searchParams.get("identifier") || "";

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName) {
      const msg = "لطفاً نام و نام خانوادگی را وارد فرمایید.";
      setError(msg);
      toast.error(msg, "فیلد الزامی");
      return;
    }

    if (!cleanPhone) {
      const msg = "لطفاً شماره موبایل خود را وارد فرمایید.";
      setError(msg);
      toast.error(msg, "فیلد الزامی");
      return;
    }

    if (password !== confirmPassword) {
      const msg = "تکرار رمز عبور با رمز عبور اصلی مطابقت ندارد.";
      setError(msg);
      toast.error(msg, "خطای رمز عبور");
      return;
    }

    if (password.length < 6) {
      const msg = "طول رمز عبور باید حداقل ۶ کاراکتر باشد.";
      setError(msg);
      toast.error(msg, "رمز عبور کوتاه");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        full_name: cleanName,
        phone_number: cleanPhone,
        password: password,
      });
      toast.success("ثبت‌نام شما با موفقیت انجام شد. خوش آمدید!", "ثبت‌نام موفق");
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "خطا در ثبت‌نام کاربر.");
        toast.error(err.message || "خطا در ثبت‌نام کاربر.", "خطای ثبت‌نام");
      } else {
        const fallbackMsg = "خطا در برقراری ارتباط با سرور.";
        setError(fallbackMsg);
        toast.error(fallbackMsg, "خطای ارتباط");
      }
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
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ایجاد حساب کاربری جدید
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            مشخصات خود را جهت ثبت و ورود به سامانه وارد فرمایید
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-950/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="علی رضایی"
                  className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                شماره موبایل
              </label>
              <div className="relative">
                <Smartphone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09121111111"
                  dir="ltr"
                  className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-left font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                رمز عبور (حداقل ۶ کاراکتر)
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-left"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                تکرار رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <span>ثبت‌نام و ورود</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
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
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-sm text-slate-400">در حال بارگذاری...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
