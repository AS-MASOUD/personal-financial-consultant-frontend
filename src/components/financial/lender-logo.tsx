"use client";

import React from "react";
import {
  Building,
  Building2,
  Users,
  CreditCard,
  Wallet,
  Coins,
  ShieldCheck,
  Landmark,
} from "lucide-react";

interface LenderLogoProps {
  lender?: string | null;
  liabilityType?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

interface BrandConfig {
  name: string;
  shortCode: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  icon?: React.ElementType;
  badgeLabel?: string;
}

export function getLenderBrand(lenderName = "", type = ""): BrandConfig {
  const norm = (lenderName || "").toLowerCase().trim();
  const normType = (type || "").toLowerCase().trim();

  // Friend / Personal loans
  if (
    normType === "friend_borrowed" ||
    normType === "friend_lent" ||
    norm.includes("دوست") ||
    norm.includes("آشنا") ||
    norm.includes("فامیل") ||
    norm.includes("شخصی")
  ) {
    return {
      name: lenderName || "شخص / دوست",
      shortCode: "شخصی",
      bgGradient: "from-emerald-500/20 to-teal-500/10",
      textColor: "text-emerald-700 dark:text-emerald-300",
      borderColor: "border-emerald-500/30",
      accentColor: "#10b981",
      icon: Users,
      badgeLabel: "قرض‌الحسنه فردی",
    };
  }

  // Iranian Banks
  if (norm.includes("ملت") || norm.includes("mellat")) {
    return {
      name: "بانک ملت",
      shortCode: "ملت",
      bgGradient: "from-rose-600 to-rose-800",
      textColor: "text-white",
      borderColor: "border-rose-700",
      accentColor: "#e11d48",
      badgeLabel: "بانک",
    };
  }
  if (norm.includes("ملی") || norm.includes("melli")) {
    return {
      name: "بانک ملی ایران",
      shortCode: "ملی",
      bgGradient: "from-blue-700 to-indigo-900",
      textColor: "text-amber-300",
      borderColor: "border-blue-600",
      accentColor: "#1d4ed8",
      badgeLabel: "بانک دولتی",
    };
  }
  if (norm.includes("مسکن") || norm.includes("maskan") || normType === "mortgage") {
    return {
      name: "بانک مسکن",
      shortCode: "مسکن",
      bgGradient: "from-orange-500 to-amber-700",
      textColor: "text-white",
      borderColor: "border-orange-600",
      accentColor: "#ea580c",
      icon: Building,
      badgeLabel: "تسهیلات مسکن",
    };
  }
  if (norm.includes("تجارت") || norm.includes("tejarat")) {
    return {
      name: "بانک تجارت",
      shortCode: "تجارت",
      bgGradient: "from-cyan-600 to-blue-800",
      textColor: "text-white",
      borderColor: "border-cyan-500",
      accentColor: "#0284c7",
      badgeLabel: "بانک",
    };
  }
  if (norm.includes("صادرات") || norm.includes("saderat")) {
    return {
      name: "بانک صادرات ایران",
      shortCode: "صادرات",
      bgGradient: "from-blue-900 to-indigo-950",
      textColor: "text-rose-400",
      borderColor: "border-blue-800",
      accentColor: "#1e3a8a",
      badgeLabel: "بانک",
    };
  }
  if (norm.includes("سپه") || norm.includes("sepah")) {
    return {
      name: "بانک سپه",
      shortCode: "سپه",
      bgGradient: "from-slate-800 to-slate-950",
      textColor: "text-amber-400",
      borderColor: "border-amber-600/40",
      accentColor: "#d97706",
      badgeLabel: "بانک",
    };
  }
  if (norm.includes("سامان") || norm.includes("saman")) {
    return {
      name: "بانک سامان",
      shortCode: "سامان",
      bgGradient: "from-sky-500 to-blue-600",
      textColor: "text-white",
      borderColor: "border-sky-400",
      accentColor: "#0ea5e9",
      badgeLabel: "بانک خصوصی",
    };
  }
  if (norm.includes("پاسارگاد") || norm.includes("pasargad")) {
    return {
      name: "بانک پاسارگاد",
      shortCode: "پاسارگاد",
      bgGradient: "from-neutral-900 to-stone-900",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/40",
      accentColor: "#eab308",
      badgeLabel: "بانک خصوصی",
    };
  }
  if (norm.includes("پارسیان") || norm.includes("parsian")) {
    return {
      name: "بانک پارسیان",
      shortCode: "پارسیان",
      bgGradient: "from-red-900 to-rose-950",
      textColor: "text-amber-300",
      borderColor: "border-rose-800",
      accentColor: "#991b1b",
      badgeLabel: "بانک خصوصی",
    };
  }
  if (norm.includes("رسالت") || norm.includes("resalat")) {
    return {
      name: "بانک قرض‌الحسنه رسالت",
      shortCode: "رسالت",
      bgGradient: "from-teal-600 to-emerald-800",
      textColor: "text-white",
      borderColor: "border-teal-500",
      accentColor: "#0d9488",
      badgeLabel: "قرض‌الحسنه",
    };
  }
  if (norm.includes("مهر") || norm.includes("mehr")) {
    return {
      name: "بانک قرض‌الحسنه مهر ایران",
      shortCode: "مهر",
      bgGradient: "from-emerald-600 to-green-800",
      textColor: "text-white",
      borderColor: "border-emerald-500",
      accentColor: "#059669",
      badgeLabel: "قرض‌الحسنه",
    };
  }
  if (norm.includes("بلو") || norm.includes("blu")) {
    return {
      name: "بلوبانک (سامان)",
      shortCode: "blu",
      bgGradient: "from-blue-600 via-indigo-600 to-cyan-500",
      textColor: "text-white font-mono",
      borderColor: "border-blue-400",
      accentColor: "#2563eb",
      badgeLabel: "نئوبانک",
    };
  }
  if (norm.includes("ویپاد") || norm.includes("wepod") || norm.includes("vpod")) {
    return {
      name: "ویپاد (پاسارگاد)",
      shortCode: "wepod",
      bgGradient: "from-purple-600 to-indigo-800",
      textColor: "text-white font-mono",
      borderColor: "border-purple-400",
      accentColor: "#7c3aed",
      badgeLabel: "نئوبانک",
    };
  }
  if (norm.includes("شهر") || norm.includes("shahr")) {
    return {
      name: "بانک شهر",
      shortCode: "شهر",
      bgGradient: "from-amber-600 to-orange-800",
      textColor: "text-white",
      borderColor: "border-amber-500",
      accentColor: "#d97706",
      badgeLabel: "بانک",
    };
  }
  if (norm.includes("کشاورزی") || norm.includes("keshavarzi")) {
    return {
      name: "بانک کشاورزی",
      shortCode: "کشاورزی",
      bgGradient: "from-green-700 to-emerald-900",
      textColor: "text-white",
      borderColor: "border-green-600",
      accentColor: "#15803d",
      badgeLabel: "بانک دولتی",
    };
  }
  if (norm.includes("رفاه") || norm.includes("refah")) {
    return {
      name: "بانک رفاه کارگران",
      shortCode: "رفاه",
      bgGradient: "from-blue-700 to-indigo-900",
      textColor: "text-white",
      borderColor: "border-blue-600",
      accentColor: "#1d4ed8",
      badgeLabel: "بانک",
    };
  }

  // BNPL & Platforms
  if (norm.includes("اسنپ") || norm.includes("snapp")) {
    return {
      name: "اسنپ‌پی (SnappPay)",
      shortCode: "اسنپ",
      bgGradient: "from-emerald-500 to-teal-700",
      textColor: "text-white",
      borderColor: "border-emerald-400",
      accentColor: "#10b981",
      icon: CreditCard,
      badgeLabel: "خرید اقساطی BNPL",
    };
  }
  if (norm.includes("دیجی") || norm.includes("digi")) {
    return {
      name: "دیجی‌پی (DigiPay)",
      shortCode: "دیجی",
      bgGradient: "from-red-600 to-rose-700",
      textColor: "text-white",
      borderColor: "border-red-400",
      accentColor: "#ef4444",
      icon: CreditCard,
      badgeLabel: "خرید اقساطی BNPL",
    };
  }
  if (norm.includes("ازکی") || norm.includes("azki")) {
    return {
      name: "ازکی‌وام (AzkiVam)",
      shortCode: "ازکی",
      bgGradient: "from-yellow-500 to-amber-600",
      textColor: "text-slate-900",
      borderColor: "border-yellow-400",
      accentColor: "#eab308",
      icon: CreditCard,
      badgeLabel: "پلتفرم اعتباری",
    };
  }
  if (norm.includes("تارا") || norm.includes("tara")) {
    return {
      name: "تارا (Tara)",
      shortCode: "تارا",
      bgGradient: "from-purple-600 to-indigo-700",
      textColor: "text-white",
      borderColor: "border-purple-400",
      accentColor: "#8b5cf6",
      icon: CreditCard,
      badgeLabel: "خرید اعتباری",
    };
  }
  if (norm.includes("صندوق") || norm.includes("خانگی")) {
    return {
      name: lenderName || "صندوق خانگی",
      shortCode: "صندوق",
      bgGradient: "from-indigo-600 to-purple-800",
      textColor: "text-white",
      borderColor: "border-indigo-400",
      accentColor: "#6366f1",
      icon: Users,
      badgeLabel: "صندوق قرض‌الحسنه",
    };
  }

  // Fallback for banks or general lenders
  const isBank =
    norm.includes("بانک") ||
    norm.includes("bank") ||
    normType === "bank_loan" ||
    normType === "auto_loan";

  return {
    name: lenderName || (isBank ? "بانک عامل" : "تسهیلات دهنده"),
    shortCode: lenderName ? lenderName.slice(0, 4) : "بانک",
    bgGradient: "from-slate-700 to-slate-900",
    textColor: "text-white",
    borderColor: "border-slate-600",
    accentColor: "#475569",
    icon: isBank ? Landmark : Building2,
    badgeLabel: isBank ? "بانک عامل" : "مؤسسه اعتباری",
  };
}

export function LenderLogo({
  lender,
  liabilityType,
  size = "md",
  className = "",
}: LenderLogoProps) {
  const brand = getLenderBrand(lender || "", liabilityType);

  const sizeClasses = {
    sm: "w-7 h-7 text-[10px] rounded-lg",
    md: "w-10 h-10 text-xs rounded-xl",
    lg: "w-14 h-14 text-sm rounded-2xl",
    xl: "w-16 h-16 text-base rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-8 w-8",
  }[size];

  const Icon = brand.icon;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 font-bold shadow-sm border bg-gradient-to-br transition-transform select-none ${brand.bgGradient} ${brand.textColor} ${brand.borderColor} ${sizeClasses} ${className}`}
      title={`${brand.name} ${brand.badgeLabel ? `(${brand.badgeLabel})` : ""}`}
    >
      {Icon ? (
        <Icon className={iconSizes} />
      ) : (
        <span className="truncate px-1 tracking-tight text-center leading-none">
          {brand.shortCode}
        </span>
      )}

      {/* Decorative inner emblem ring */}
      <span className="absolute inset-0 rounded-[inherit] border border-white/20 pointer-events-none" />
    </div>
  );
}
