"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

export type CurrencyType = "TOMAN" | "USD";

interface CurrencyContextValue {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  toggleCurrency: () => void;
  exchangeRate: number; // 1 USD in Toman (latest rate from API)
  formatMoney: (amount: number | string | null | undefined, baseCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>("TOMAN");
  // Latest dollar price upon Toman (default 100,000 Toman per 1 USD until fetched from live market API)
  const [exchangeRate, setExchangeRate] = useState<number>(100000);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency") as CurrencyType | null;
    if (saved === "TOMAN" || saved === "USD") {
      const timer = setTimeout(() => {
        setCurrency(saved);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch the latest USD to Toman rate from backend API
  useEffect(() => {
    let isSubscribed = true;
    async function fetchLiveDollarRate() {
      try {
        const rates = await api.getMarketRates();
        if (rates && rates.usd_toman_rate && Number(rates.usd_toman_rate) > 0) {
          if (isSubscribed) {
            setExchangeRate(Number(rates.usd_toman_rate));
          }
        }
      } catch (e) {
        // Silently preserve current exchange rate fallback if unauthenticated or offline
      }
    }
    fetchLiveDollarRate();
    // Refresh live rate every 3 minutes
    const interval = setInterval(fetchLiveDollarRate, 3 * 60 * 1000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
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
    baseCurrency = "TOMAN"
  ): string => {
    if (amount === null || amount === undefined) {
      return currency === "TOMAN" ? "0 تومان" : "$0.00";
    }
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return currency === "TOMAN" ? "0 تومان" : "$0.00";

    const rate = exchangeRate > 0 ? exchangeRate : 100000;

    if (currency === "TOMAN") {
      // If the source data is in USD, convert to Toman using latest dollar rate
      const valInToman = baseCurrency === "USD" ? num * rate : num;
      return formatCurrency(valInToman, "TOMAN");
    } else {
      // If the source data is in Toman, convert to USD using latest dollar rate
      const valInUSD = baseCurrency === "TOMAN" ? num / rate : num;
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
      formatMoney: (amount: number | string | null | undefined, baseCurrency = "TOMAN") =>
        formatCurrency(amount, "TOMAN"),
    };
  }
  return context;
}
