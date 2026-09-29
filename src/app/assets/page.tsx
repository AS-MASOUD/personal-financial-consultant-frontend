"use client";

import React, { useState, useMemo } from "react";
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
  Edit2,
  Trash2,
  Power,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import { useToast } from "@/components/toast-provider";
import { Asset, AssetClass, MarketQuote } from "@/types/financial";

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const { formatMoney } = useCurrency();
  const { toast } = useToast();

  // Fetch asset class definitions from backend
  const { data: assetClasses } = useQuery({
    queryKey: ["asset-classes"],
    queryFn: () => api.getAssetClasses(),
    staleTime: 5 * 60 * 1000,
  });

  // Derive the labels map from backend data
  const CLASS_LABELS: Record<string, string> = useMemo(() => {
    if (!assetClasses) return {};
    return Object.fromEntries(assetClasses.map((c: AssetClass) => [c.code, c.label]));
  }, [assetClasses]);

  const [marketCategory, setMarketCategory] = useState<
    "all" | "gold" | "commodities" | "currencies" | "crypto"
  >("all");

  // Assets Filter: All, Active, Inactive
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Multi-Selection State for Bulk Deletion
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Add Asset Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetClass, setAssetClass] = useState("commodity");
  const [currency, setCurrency] = useState("TOMAN");
  const [price, setPrice] = useState("");
  const [isActiveNew, setIsActiveNew] = useState(false);
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
        symbol: symbol.toUpperCase().trim(),
        name: name.trim(),
        asset_class: assetClass,
        currency,
        initial_price: price || "0",
        is_active: isActiveNew,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsAddOpen(false);
      setSymbol("");
      setName("");
      setPrice("");
      setNotes("");
      setIsActiveNew(true);
      toast.success("دارایی جدید با موفقیت اضافه شد.", "ثبت دارایی");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در ایجاد دارایی.";
      toast.error(msg, "خطا");
    },
  });

  // Toggle Active Asset Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.updateAsset(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success("وضعیت فعال بودن دارایی بروزرسانی شد.", "تغییر وضعیت");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در تغییر وضعیت دارایی.";
      toast.error(msg, "خطا");
    },
  });

  // Delete Asset Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success("دارایی با موفقیت حذف شد.", "حذف دارایی");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در حذف دارایی.";
      toast.error(msg, "خطا");
    },
  });

  // Bulk Delete Asset Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.deleteAsset(id)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setSelectedAssetIds([]);
      toast.success(`${ids.length} دارایی با موفقیت از کاتالوگ حذف شدند.`, "حذف دسته‌ای");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در حذف دسته‌ای دارایی‌ها.";
      toast.error(msg, "خطا در حذف دسته‌ای");
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
      quote.symbol.includes("GOLD") ||
      quote.symbol.includes("COIN") ||
      quote.symbol.includes("XAU")
    ) {
      detectedClass = "commodity";
    }

    setAssetClass(detectedClass);
    setCurrency(detectedCurrency);
    setIsActiveNew(false);
    setIsAddOpen(true);
  };

  // Filtered market quotes
  const filteredQuotes: MarketQuote[] = useMemo(() => {
    if (!marketRates) return [];
    switch (marketCategory) {
      case "gold":
        return marketRates.gold_and_coins || [];
      case "commodities":
        return marketRates.commodities || [];
      case "currencies":
        return marketRates.currencies || [];
      case "crypto":
        return marketRates.cryptocurrency || [];
      case "all":
      default:
        return [
          ...(marketRates.gold_and_coins || []),
          ...(marketRates.commodities || []),
          ...(marketRates.currencies || []),
          ...(marketRates.cryptocurrency || []),
        ];
    }
  }, [marketRates, marketCategory]);

  // Registered Assets categorized by active status
  const { activeAssetsCount, inactiveAssetsCount, filteredRegisteredAssets } =
    useMemo(() => {
      if (!assets) {
        return {
          activeAssetsCount: 0,
          inactiveAssetsCount: 0,
          filteredRegisteredAssets: [],
        };
      }

      let activeCount = 0;
      let inactiveCount = 0;

      assets.forEach((a) => {
        if (a.is_active !== false) {
          activeCount++;
        } else {
          inactiveCount++;
        }
      });

      let filtered = assets;
      if (activeFilter === "active") {
        filtered = assets.filter((a) => a.is_active !== false);
      } else if (activeFilter === "inactive") {
        filtered = assets.filter((a) => a.is_active === false);
      }

      return {
        activeAssetsCount: activeCount,
        inactiveAssetsCount: inactiveCount,
        filteredRegisteredAssets: filtered,
      };
    }, [assets, activeFilter]);

  return (
    <div className="space-y-6 ">
      {/* Header and Sync Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span>کاتالوگ دارایی‌ها و نرخ‌های زنده بازار</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            پایش لحظه‌ای طلا، سکه، مس و کالاها، ارزهای جهانی و رمزارزها
            (همگام‌سازی خودکار ۵ بار در روز)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            title="دریافت آخرین قیمت‌ها از BRS API"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                syncMutation.isPending ? "animate-spin text-sky-500" : ""
              }`}
            />
            <span>
              {syncMutation.isPending
                ? "در حال بروزرسانی..."
                : "بروزرسانی نرخ‌های بازار"}
            </span>
          </button>

          <button
            onClick={() => {
              setSymbol("");
              setName("");
              setPrice("");
              setNotes("");
              setIsActiveNew(true);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ثبت دارایی سفارشی</span>
          </button>
        </div>
      </div>

      {/* Live Market Section & Registered Assets Section Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Live Market Section */}
        <div className="fin-card p-5 space-y-4 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                نرخ‌های جاری بازارهای مالی
              </h3>
              {marketRates?.last_sync_time && (
                <span className="text-[11px] text-slate-400 font-mono">
                  (آخرین بروزرسانی: {formatDate(marketRates.last_sync_time)})
                </span>
              )}
            </div>

            {/* Market Category Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium overflow-x-auto max-w-full">
              {[
                { id: "all", label: "همه بازارها" },
                { id: "gold", label: "طلا و سکه ایران" },
                { id: "commodities", label: "کالاهای جهانی" },
                { id: "currencies", label: "دلار و ارزها" },
                { id: "crypto", label: "رمزارزها" },
              ].map((tab) => {
                const active = marketCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setMarketCategory(tab.id as typeof marketCategory)
                    }
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer text-xs ${
                      active
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Market Rate Cards Grid */}
          {isMarketLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              نرخی یافت نشد. دکمه «بروزرسانی نرخ‌های بازار» را کلیک فرمایید.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[750px] overflow-y-auto pr-1">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
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

        {/* Registered Assets Section with Active / Deactive Management & Multi-Select */}
        <div className="fin-card p-5 space-y-4 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-500" />
                <span>دارایی‌های ثبت‌شده در سامانه</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                مدیریت دارایی‌ها، انتخاب چندگانه و فعال‌سازی/غیرفعال‌سازی برای پورتفوی
              </p>
            </div>

            {/* Active / Inactive Filter Tabs & Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {filteredRegisteredAssets.length > 0 && (
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      filteredRegisteredAssets.length > 0 &&
                      filteredRegisteredAssets.every((a) =>
                        selectedAssetIds.includes(a.id)
                      )
                    }
                    onChange={() => {
                      const currentFilteredIds = filteredRegisteredAssets.map(
                        (a) => a.id
                      );
                      const isAllSelected = currentFilteredIds.every((id) =>
                        selectedAssetIds.includes(id)
                      );
                      if (isAllSelected) {
                        setSelectedAssetIds((prev) =>
                          prev.filter((id) => !currentFilteredIds.includes(id))
                        );
                      } else {
                        setSelectedAssetIds((prev) =>
                          Array.from(
                            new Set([...prev, ...currentFilteredIds])
                          )
                        );
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                  />
                  <span>انتخاب همه</span>
                </label>
              )}

              {selectedAssetIds.length > 0 && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `آیا از حذف ${selectedAssetIds.length} دارایی انتخاب شده مطمئن هستید؟`
                      )
                    ) {
                      bulkDeleteMutation.mutate(selectedAssetIds);
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>حذف دسته‌ای ({selectedAssetIds.length})</span>
                </button>
              )}

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold shrink-0">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs ${
                    activeFilter === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  همه ({assets?.length || 0})
                </button>
                <button
                  onClick={() => setActiveFilter("active")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer text-xs ${
                    activeFilter === "active"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>فعال ({activeAssetsCount})</span>
                </button>
                <button
                  onClick={() => setActiveFilter("inactive")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer text-xs ${
                    activeFilter === "inactive"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>غیرفعال ({inactiveAssetsCount})</span>
                </button>
              </div>
            </div>
          </div>

          {isAssetsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : filteredRegisteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredRegisteredAssets.map((asset) => {
                const isActive = asset.is_active !== false;
                const isSelected = selectedAssetIds.includes(asset.id);

                return (
                  <div
                    key={asset.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all relative ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500/50"
                        : isActive
                        ? "border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-sky-500/50 hover:shadow-md"
                        : "border-dashed border-slate-300 dark:border-slate-800 opacity-75 bg-slate-50/60 dark:bg-slate-900/40"
                    }`}
                  >
                    <div>
                      {/* Header Badges with Checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssetIds((prev) => [
                                  ...prev,
                                  asset.id,
                                ]);
                              } else {
                                setSelectedAssetIds((prev) =>
                                  prev.filter((id) => id !== asset.id)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600 shrink-0"
                          />
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {asset.symbol}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{isActive ? "فعال" : "غیرفعال"}</span>
                          </span>
                        </div>

                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          {CLASS_LABELS[asset.asset_class.toLowerCase()] ||
                            asset.asset_class}
                        </span>
                      </div>

                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                        {asset.name}
                      </h3>
                      {asset.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {asset.notes}
                        </p>
                      )}
                    </div>

                    {/* Price & Action Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          نرخ ({asset.currency})
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {asset.currency === "TOMAN"
                            ? formatMoney(asset.current_price)
                            : `$${Number(asset.current_price).toLocaleString("en-US")}`}
                        </span>
                      </div>

                      {/* Actions: Active/Deactive Toggle & Delete */}
                      <div className="flex items-center gap-1">
                        {/* Active / Deactive Toggle Button */}
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: asset.id,
                              is_active: !isActive,
                            })
                          }
                          disabled={toggleActiveMutation.isPending}
                          className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                          title={
                            isActive
                              ? "غیرفعال‌سازی این دارایی"
                              : "فعال‌سازی این دارایی"
                          }
                        >
                          {isActive ? (
                            <Power className="h-3.5 w-3.5 text-emerald-500 hover:text-amber-500" />
                          ) : (
                            <PowerOff className="h-3.5 w-3.5 text-slate-400 hover:text-emerald-500" />
                          )}
                        </button>

                        {/* Delete Asset Button */}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `آیا از حذف نماد «${asset.symbol} - ${asset.name}» مطمئن هستید؟`
                              )
                            ) {
                              deleteMutation.mutate(asset.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="حذف دارایی"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs space-y-3">
              <p>
                {activeFilter === "inactive"
                  ? "هیچ دارایی غیرفعالی در سامانه ثبت نشده است."
                  : "هیچ دارایی فعالی در این بخش یافت نشد."}
              </p>
              {activeFilter !== "inactive" && (
                <button
                  onClick={() => {
                    setSymbol("");
                    setName("");
                    setPrice("");
                    setNotes("");
                    setIsActiveNew(true);
                    setIsAddOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>ثبت اولین دارایی</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ثبت دارایی جدید
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
              className="mt-4 space-y-3.5 text-xs"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
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
                    {assetClasses?.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
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

              {/* Active Toggle on creation */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  وضعیت دارایی در پورتفوی
                </span>
                <button
                  type="button"
                  onClick={() => setIsActiveNew(!isActiveNew)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    isActiveNew
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {isActiveNew ? "فعال" : "غیرفعال"}
                </button>
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
