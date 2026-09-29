"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Coins,
  ArrowLeftRight,
  ShieldAlert,
  ArrowDownUp,
  Target,
  LineChart,
  SlidersHorizontal,
  Bot,
  Settings,
  Sparkles,
  Wallet,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

const navigationItems = [
  { name: "نمای کلی", href: "/", icon: LayoutDashboard },
  { name: "سبد دارایی (پورتفولیو)", href: "/portfolio", icon: PieChart },
  { name: "دفتر کل تراکنش‌ها", href: "/transactions", icon: ArrowLeftRight },
  { name: "بدهی‌ها و تسهیلات", href: "/liabilities", icon: ShieldAlert },
  { name: "جریان نقدینگی و بودجه", href: "/cashflow", icon: ArrowDownUp },
  { name: "اهداف مالی", href: "/goals", icon: Target },
  { name: "تحلیل و نسبت‌های مالی", href: "/analytics", icon: LineChart },
  { name: "شبیه‌ساز سناریوها", href: "/scenarios", icon: SlidersHorizontal },
  { name: "دستیار هوشمند مالی", href: "/ai", icon: Bot, highlight: true },
  { name: "فهرست دارایی‌ها", href: "/assets", icon: Coins },
  {
    name: "مدیریت کاربران و نقش‌ها",
    href: "/users",
    icon: ShieldCheck,
    sysManagerOnly: true,
  },
  { name: "پروفایل کاربری", href: "/profile", icon: UserCircle },
  { name: "تنظیمات سیستم", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSysManager } = useAuth();

  return (
    <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] tracking-tight text-sm text-slate-900 dark:text-slate-100">
            مدیریت مالی تئا
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Theia Personal
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Financial Consultant
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          // Gate sysManager-only items strictly to sysmanager
          if (item.sysManagerOnly && !isSysManager) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/60",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-sky-400"
                    : item.sysManagerOnly
                      ? "text-purple-400 group-hover:text-purple-500"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200",
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.highlight && (
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              )}
              {item.sysManagerOnly && isSysManager && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  مدیر ارشد
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Live Sync Status */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>پایگاه‌داده متصل است</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
            v0.1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
