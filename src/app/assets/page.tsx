"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Clock,
  Check,
  X,
  Loader2,
  RefreshCw,
  Coins,
  Gem,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import { useToast } from "@/components/toast-provider";
import { MarketQuote } from "@/types/financial";

const CLASS_LABELS: Record<string, string> = {
  equity: "سهام و ETF",
  crypto: "ارز دیجیتال",
  commodity: "طلا و کالاها",
  fixed_income: "درآمد ثابت و اوراق",
  real_estate: "املاک و مستغلات",
  cash: "ارز و نقدینگی",
};

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const { formatMoney } = useCurrency();
  const { toast } = useToast();

  const [marketCategory, setMarketCategory] = useState<
    "all" | "gold" | "commodities" | "currencies" | "crypto"
  >("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetClass, setAssetClass] = useState("commodity");
  const [currency, setCurrency] = useState("TOMAN");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // Query assets catalog
  const { data: assets, isLoading: isAssetsLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.getAssets(),
  });

  // Query live market rates (auto-synced 5 times a day)
  const { data: marketRates, isLoading: isMarketLoading } = useQuery({
    queryKey: ["market-rates"],
    queryFn: () => api.getMarketRates(),
    staleTime: 60 * 1000,
  });

  // Mutation for manual market synchronization
  const syncMutation = useMutation({
    mutationFn: () => api.syncMarketRates(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["market-rates"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(res.message, "همگام‌سازی بازار");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "خطا در همگام‌سازی نرخ‌ها.";
      toast.error(msg, "خطا در بروزرسانی");
    },
  });

  // Mutation for creating asset
  const createMutation = useMutation({
    mutationFn: () =>
      api.createAsset({
        symbol: symbol.toUpperCase(),
        name,
        asset_class: assetClass,
        currency,
        initial_price: price || "0",
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsAddOpen(false);
      setSymbol("");
      setName("");
      setPrice("");
      setNotes("");
      toast.success("دارایی جدید با موفقیت اضافه شد.", "ثبت دارایی");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در ایجاد دارایی.";
      toast.error(msg, "خطا");
    },
  });

  const handlePreFillAsset = (quote: MarketQuote) => {
    setSymbol(quote.symbol);
    setName(quote.name);
    setPrice(String(quote.price));

    let detectedClass = "commodity";
    let detectedCurrency = quote.unit === "دلار" ? "USD" : "TOMAN";

    if (quote.category === "crypto") {
      detectedClass = "crypto";
      detectedCurrency = "USD";
    } else if (quote.category === "currency") {
      detectedClass = "cash";
      detectedCurrency = "TOMAN";
    } else if (
      quote.category === "gold_coin" ||
      quote.category === "commodity"
    ) {
      detectedClass = "commodity";
      if (
        quote.symbol === "XAUUSD" ||
        quote.symbol === "CU" ||
        quote.symbol === "XAGUSD"
      ) {
        detectedCurrency = "USD";
      } else {
        detectedCurrency = "TOMAN";
      }
    }

    setAssetClass(detectedClass);
    setCurrency(detectedCurrency);
    setIsAddOpen(true);
  };

  // Filter quotes based on selected market tab
  const getFilteredQuotes = (): MarketQuote[] => {
    if (!marketRates) return [];
    if (marketCategory === "gold") return marketRates.gold_and_coins || [];
    if (marketCategory === "commodities") return marketRates.commodities || [];
    if (marketCategory === "currencies") return marketRates.currencies || [];
    if (marketCategory === "crypto") return marketRates.cryptocurrency || [];

    // "all": Top picks across all categories
    return [
      ...(marketRates.gold_and_coins?.slice(0, 5) || []),
      ...(marketRates.commodities?.slice(0, 5) || []),
      ...(marketRates.currencies?.slice(0, 4) || []),
      ...(marketRates.cryptocurrency?.slice(0, 4) || []),
    ];
  };

  const filteredQuotes = getFilteredQuotes();

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-500" />
            <span>پایش و نرخ لحظه‌ای دارایی‌ها و بازارها</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            نرخ‌های زنده طلا (داخلی و انس جهانی)، فلزات پایه (مس، نقره)، ارزهای
            فیات و رمزارزها (همگام‌سازی دوره‌ای ۵ بار در روز)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            // disabled={syncMutation.isPending}
            disabled={true}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="بروزرسانی دستی نرخ‌های لحظه‌ای از بازار"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin text-sky-500" : ""}`}
            />
            <span>
              {syncMutation.isPending
                ? "در حال دریافت نرخ‌ها..."
                : "بروزرسانی نرخ‌های بازار"}
            </span>
          </button>

          <button
            onClick={() => {
              setSymbol("");
              setName("");
              setPrice("");
              setNotes("");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>افزودن دارایی جدید</span>
          </button>
        </div>
      </div>

      {/* Live Market Board Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              تابلوی نرخ‌های زنده بازار
            </h3>
            {marketRates?.last_sync_time && (
              <span className="text-[11px] text-slate-400 font-mono">
                (آخرین بروزرسانی: {formatDate(marketRates.last_sync_time)})
              </span>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: "all", label: "منتخب بازار", icon: Layers },
              { id: "gold", label: "طلا و سکه", icon: Gem },
              { id: "commodities", label: "فلزات و انرژی", icon: Coins },
              { id: "currencies", label: "ارزها", icon: DollarSign },
              { id: "crypto", label: "رمزارزها", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = marketCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setMarketCategory(tab.id as typeof marketCategory)
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Market Rate Cards Grid */}
        {isMarketLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            نرخی یافت نشد. دکمه «بروزرسانی نرخ‌های بازار» را کلیک فرمایید.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredQuotes.map((quote) => {
              const isUSD = quote.unit === "دلار";
              const isPositive = (quote.change_percent ?? 0) >= 0;

              return (
                <div
                  key={`${quote.category}-${quote.symbol}`}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3.5 flex flex-col justify-between hover:border-sky-500/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {quote.symbol}
                        </span>
                        {quote.symbol === "XAUUSD" && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                            اونس جهانی
                          </span>
                        )}
                        {quote.symbol === "IR_GOLD_18K" && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                            ایران (گرم)
                          </span>
                        )}
                        {quote.symbol === "CU" && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold">
                            مس
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {quote.name}
                      </h4>
                    </div>

                    {quote.change_percent !== null &&
                      quote.change_percent !== undefined && (
                        <span
                          className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                          dir="ltr"
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>
                            {quote.change_percent > 0
                              ? `+${quote.change_percent}%`
                              : `${quote.change_percent}%`}
                          </span>
                        </span>
                      )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                        {Number(quote.price).toLocaleString("en-US")}{" "}
                        {quote.unit}
                      </div>
                      {isUSD && quote.price_toman && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          ≈ {Number(quote.price_toman).toLocaleString("en-US")}{" "}
                          تومان
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handlePreFillAsset(quote)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      title="ثبت این نماد در دارایی‌های پایش‌شده من"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">ثبت در سبد</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registered Assets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              دارایی‌های ثبت‌شده در سامانه
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              دارایی‌هایی که نرخ آن‌ها به صورت خودکار یا دستی در محاسبات پورتفوی
              شما استفاده می‌شود
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400">
            {assets?.length || 0} دارایی فعال
          </span>
        </div>

        {isAssetsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="fin-card h-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets?.map((asset) => (
              <div
                key={asset.id}
                className="fin-card p-5 flex flex-col justify-between hover:border-sky-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {asset.symbol}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      {CLASS_LABELS[asset.asset_class.toLowerCase()] ||
                        asset.asset_class}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2.5">
                    {asset.name}
                  </h3>
                  {asset.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {asset.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      نرخ فعلی ({asset.currency})
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {asset.currency === "TOMAN"
                        ? formatMoney(asset.current_price)
                        : `$${Number(asset.current_price).toLocaleString("en-US")}`}
                    </span>
                  </div>

                  <div className="text-start">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-mono">
                      <Clock className="h-3 w-3" />
                      {asset.price_updated_at
                        ? formatDate(asset.price_updated_at)
                        : "پایه‌ای"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ثبت یا بروزرسانی دارایی
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  نماد / تیکر (مثلاً IR_GOLD_18K, XAUUSD, Cu, BTC, USD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً CU یا IR_GOLD_18K"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  نام کامل دارایی
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً طلای ۱۸ عیار یا مس جهانی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    دسته‌بندی دارایی
                  </label>
                  <select
                    value={assetClass}
                    onChange={(e) => setAssetClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="commodity">طلا و کالاها</option>
                    <option value="crypto">ارز دیجیتال</option>
                    <option value="cash">ارز فیات و نقدینگی</option>
                    <option value="equity">سهام و صندوق ETF</option>
                    <option value="fixed_income">
                      اوراق قرضه و درآمد ثابت
                    </option>
                    <option value="real_estate">املاک و مستغلات</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ارز پایه قیمت
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  >
                    <option value="TOMAN">تومان (TOMAN)</option>
                    <option value="USD">دلار (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  نرخ فعلی ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت (اختیاری)
                </label>
                <textarea
                  rows={2}
                  placeholder="توضیحات یا استراتژی سرمایه‌گذاری"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>ثبت دارایی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
