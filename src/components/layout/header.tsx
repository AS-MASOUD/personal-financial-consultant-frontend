"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Plus,
  RefreshCw,
  ArrowLeftRight,
  LogOut,
  LogIn,
  ShieldCheck,
  Sparkles,
  Building2,
  UserCheck,
  Eye,
  Bell,
  CheckCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  Info,
  UserCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-provider";
import { useAuth } from "@/components/auth-provider";
import { SystemRole } from "@/types/auth";
import { api } from "@/lib/api";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenQuickTx?: () => void;
}

const emptySubscribe = () => () => {};

export function Header({ title = "نمای کلی", subtitle, onOpenQuickTx }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const { user, isAuthenticated, logout, isSysManager, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Notifications Query
  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications({ limit: 15 }),
    refetchInterval: 60000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const checkTriggersMutation = useMutation({
    mutationFn: () => api.checkMarketTriggers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case "sysmanager":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="h-2.5 w-2.5" />
            <span>SysManager</span>
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Building2 className="h-2.5 w-2.5" />
            <span>Admin</span>
          </span>
        );
      case "user":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <UserCheck className="h-2.5 w-2.5" />
            <span>User</span>
          </span>
        );
      case "viewer":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Eye className="h-2.5 w-2.5" />
            <span>Viewer</span>
          </span>
        );
    }
  };

  const unreadCount = notifData?.unread_count || 0;
  const notificationsList = notifData?.items || [];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Currency Switcher (Toman / Dollar) */}
        <button
          onClick={toggleCurrency}
          title="تغییر واحد پول (تومان / دلار)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeftRight className="h-3 w-3 text-sky-500" />
          <span>نمایش: {currency === "TOMAN" ? "تومان" : "دلار ($)"}</span>
        </button>

        {/* Refresh Financial Data */}
        <button
          onClick={handleRefresh}
          title="به‌روزرسانی داده‌های مالی"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-sky-500" : ""}`} />
        </button>

        {/* Notification Center Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsUserMenuOpen(false);
            }}
            title="اعلان‌ها و هشدارهای بازار"
            className="p-2 rounded-lg relative text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsNotificationOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-40 space-y-2 text-xs">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      اعلان‌ها و هشدارهای بازار
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {unreadCount} جدید
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => checkTriggersMutation.mutate()}
                      disabled={checkTriggersMutation.isPending}
                      title="بررسی نوسان بازار و اهداف"
                      className="p-1 rounded text-slate-400 hover:text-sky-500 transition-colors"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${
                          checkTriggersMutation.isPending ? "animate-spin text-sky-500" : ""
                        }`}
                      />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        title="خواندن همه"
                        className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        <CheckCheck className="h-3 w-3" />
                        <span>خواندن همه</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notificationsList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      اعلان جدیدی وجود ندارد.
                    </div>
                  ) : (
                    notificationsList.map((notif) => {
                      const isVolatility = notif.notification_type === "ASSET_VOLATILITY";
                      const isGoal = notif.notification_type === "GOAL_REACHED";

                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) {
                              markReadMutation.mutate(notif.id);
                            }
                          }}
                          className={`pt-2 p-2 rounded-xl transition-colors cursor-pointer ${
                            !notif.is_read
                              ? "bg-sky-500/5 hover:bg-sky-500/10"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0">
                              {isVolatility ? (
                                <div className="h-6 w-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                </div>
                              ) : isGoal ? (
                                <div className="h-6 w-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                  <Award className="h-3.5 w-3.5" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                                  <Info className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                  {notif.title}
                                </span>
                                {!notif.is_read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span>{new Date(notif.created_at).toLocaleTimeString("fa-IR")}</span>
                                {isVolatility && (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    توصیه: تحلیل و بازتنظیم سبد
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="تغییر حالت تیره / روشن"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors w-8 h-8 flex items-center justify-center"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4 block" />
          )}
        </button>

        {/* New Transaction Button */}
        {onOpenQuickTx && (
          <button
            onClick={onOpenQuickTx}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all shadow-sky-600/20 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ثبت تراکنش</span>
          </button>
        )}

        {/* User Identity / Authentication Component */}
        <div className="relative mr-1">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-900/70 transition-all text-xs"
              >
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.full_name}
                  </span>
                  <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-40 space-y-1 text-xs">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {user.full_name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono" dir="ltr">
                        {user.phone_number || user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <UserCircle className="h-4 w-4 text-sky-500" />
                      <span>مشاهده و ویرایش پروفایل</span>
                    </Link>

                    {isSysManager && (
                      <Link
                        href="/users"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                        <span>مدیریت کاربران و نقش‌ها</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-right"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:border-purple-500/60 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-all shadow-xs"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>ورود / ثبت‌نام</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
