import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts any Persian or Arabic numerals in a string to standard English ASCII digits (0-9).
 */
export function normalizeDigitsToEnglish(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Formats a raw number or string into English comma-separated format (e.g. "1,250,000").
 */
export function formatEnglishNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const normalized = normalizeDigitsToEnglish(value);
  const clean = normalized.replace(/\D/g, "");
  if (!clean) return "";
  const num = Number(clean);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-US");
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "TOMAN",
  decimals = 2
): string {
  if (amount === null || amount === undefined) {
    return currency === "TOMAN" || currency === "IRT" ? "0 تومان" : "$0.00";
  }
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return currency === "TOMAN" || currency === "IRT" ? "0 تومان" : "$0.00";
  }

  if (currency === "TOMAN" || currency === "IRT") {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(num));
    return `${formatted} تومان`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0.00%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00%";
  const prefix = num > 0 ? "+" : "";
  return `${prefix}${num.toFixed(2)}%`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Validates that an Iranian mobile phone starts with 09 and has exactly 11 digits.
 */
export const IRAN_PHONE_REGEX = /^09\d{9}$/;

export function isValidIranPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const normalized = normalizeDigitsToEnglish(phone).replace(/\D/g, "");
  return IRAN_PHONE_REGEX.test(normalized);
}

/**
 * Validates that a user full name is between 2 and 50 characters.
 */
export function isValidFullName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

