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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Portfolio", href: "/portfolio", icon: PieChart },
  { name: "Assets", href: "/assets", icon: Coins },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Liabilities", href: "/liabilities", icon: ShieldAlert },
  { name: "Cash Flow", href: "/cashflow", icon: ArrowDownUp },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Analytics", href: "/analytics", icon: LineChart },
  { name: "Scenarios", href: "/scenarios", icon: SlidersHorizontal },
  { name: "AI Assistant", href: "/ai", icon: Bot, highlight: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight text-sm text-slate-900 dark:text-slate-100">
            Personal FC
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Command Center
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
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
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-sky-400"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.highlight && (
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
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
            <span>Database Online</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
