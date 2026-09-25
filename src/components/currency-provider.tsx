"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

export type CurrencyType = "TOMAN" | "USD";

interface CurrencyContextValue {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  toggleCurrency: () => void;
  exchangeRate: number; // 1 USD in Toman
  formatMoney: (amount: number | string | null | undefined, baseCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>("TOMAN");
  // Default demo exchange rate: 1 USD = 100,000 Toman
  const exchangeRate = 100000;

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency") as CurrencyType | null;
    if (saved === "TOMAN" || saved === "USD") {
      const timer = setTimeout(() => {
        setCurrency(saved);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSetCurrency = (c: CurrencyType) => {
    setCurrency(c);
    localStorage.setItem("preferred_currency", c);
  };

  const toggleCurrency = () => {
    const next = currency === "TOMAN" ? "USD" : "TOMAN";
    handleSetCurrency(next);
  };

  const formatMoney = (
    amount: number | string | null | undefined,
    baseCurrency = "USD"
  ): string => {
    if (amount === null || amount === undefined) {
      return currency === "TOMAN" ? "0 تومان" : "$0.00";
    }
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return currency === "TOMAN" ? "0 تومان" : "$0.00";

    if (currency === "TOMAN") {
      // If the source data is in USD, convert to Toman
      const valInToman = baseCurrency === "USD" ? num * exchangeRate : num;
      return formatCurrency(valInToman, "TOMAN");
    } else {
      // If the source data is in Toman, convert to USD
      const valInUSD = baseCurrency === "TOMAN" ? num / exchangeRate : num;
      return formatCurrency(valInUSD, "USD");
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        toggleCurrency,
        exchangeRate,
        formatMoney,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      currency: "TOMAN" as CurrencyType,
      setCurrency: () => {},
      toggleCurrency: () => {},
      exchangeRate: 100000,
      formatMoney: (amount: number | string | null | undefined) => formatCurrency(amount, "TOMAN"),
    };
  }
  return context;
}
