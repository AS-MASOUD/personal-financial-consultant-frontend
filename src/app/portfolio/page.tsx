"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import { useToast } from "@/components/toast-provider";
import { AssetPosition } from "@/types/financial";

const CLASS_LABELS: Record<string, string> = {
  ALL: "همه دارایی‌ها",
  EQUITY: "سهام و ETF",
  CRYPTO: "ارزهای دیجیتال",
  COMMODITY: "طلا و کالاها",
  FIXED_INCOME: "درآمد ثابت و اوراق",
};

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const { formatMoney } = useCurrency();

  const [editingPosition, setEditingPosition] = useState<AssetPosition | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [editCostBasis, setEditCostBasis] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["asset-positions"],
    queryFn: () => api.getPositions(),
  });

  const handleOpenEdit = (pos: AssetPosition) => {
    setEditingPosition(pos);
    setEditQuantity(pos.quantity);
    setEditCostBasis(pos.average_cost_basis);
    setEditError(null);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      setEditError(null);
      if (!editingPosition) return;
      const q = parseFloat(editQuantity);
      if (isNaN(q) || q <= 0) {
        throw new Error("لطفاً تعداد یا حجم معتبر (بزرگتر از صفر) وارد فرمایید.");
      }
      const cb = parseFloat(editCostBasis);
      if (isNaN(cb) || cb < 0) {
        throw new Error("میانگین بهای خرید نمی‌تواند منفی باشد.");
      }
      return api.updatePosition(editingPosition.id, {
        quantity: editQuantity.trim(),
        average_cost_basis: editCostBasis.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-positions"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setEditingPosition(null);
      toast.success("موقعیت دارایی با موفقیت بروزرسانی شد.", "ویرایش پورتفوی");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در بروزرسانی موقعیت دارایی.";
      setEditError(msg);
      toast.error(msg, "خطا در ویرایش");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-positions"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success("موقعیت دارایی با موفقیت از پورتفوی حذف گردید.", "حذف موقعیت");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "خطا در حذف موقعیت دارایی.";
      toast.error(msg, "خطا در حذف");
    },
  });

  const filteredPositions = React.useMemo(() => {
    if (!positions) return [];
    if (selectedClass === "ALL") return positions;
    return positions.filter(
      (p) => p.asset_class.toLowerCase() === selectedClass.toLowerCase()
    );
  }, [positions, selectedClass]);

  const totalPortfolioValue = React.useMemo(() => {
    if (!positions) return 0;
    return positions.reduce((sum, p) => sum + parseFloat(p.current_value), 0);
  }, [positions]);

  const totalUnrealizedGain = React.useMemo(() => {
    if (!positions) return 0;
    return positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pnl), 0);
  }, [positions]);

  const assetClasses = ["ALL", "EQUITY", "CRYPTO", "COMMODITY", "FIXED_INCOME"];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="fin-card h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="fin-card h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fin-card p-5 border-s-4 border-s-sky-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ارزش کل دارایی‌ها
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {formatMoney(totalPortfolioValue)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            در {positions?.length || 0} موقعیت فعال سرمایه‌گذاری
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-emerald-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            کل سود / زیان تحقق‌نیافته
          </span>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              totalUnrealizedGain >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatMoney(totalUnrealizedGain)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            سود/زیان دفتری خالص نسبت به بهای تمام‌شده
          </span>
        </div>

        <div className="fin-card p-5 border-s-4 border-s-indigo-500">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            بیشترین تمرکز دارایی
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {positions && positions[0] ? positions[0].asset_symbol : "—"}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {positions && positions[0]
              ? `${(
                  (parseFloat(positions[0].current_value) / (totalPortfolioValue || 1)) *
                  100
                ).toFixed(1)}% از ارزش کل پورتفوی`
              : "موقعیتی ثبت نشده است"}
          </span>
        </div>
      </div>

      {/* Asset Class Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          {assetClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedClass === cls
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {CLASS_LABELS[cls] || cls}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Holdings Table */}
      <div className="fin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            ترکیب و عملکرد دارایی‌های پورتفوی
          </h3>
          <span className="text-xs text-slate-400">
            ارزش‌گذاری بر مبنای نرخ‌های لحظه‌ای بازار
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {selectedClass === "ALL"
                  ? "هنوز هیچ دارایی ثبت نشده است"
                  : `هیچ دارایی در دسته «${CLASS_LABELS[selectedClass]}» وجود ندارد`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                برای افزودن اولین دارایی، از تب «تراکنش‌ها» اقدام کنید
              </p>
            </div>
          ) : (
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold text-start">دارایی / نماد</th>
                  <th className="py-3 px-4 font-semibold text-start">دسته‌بندی</th>
                  <th className="py-3 px-4 font-semibold text-end">تعداد / موجودی</th>
                  <th className="py-3 px-4 font-semibold text-end">قیمت لحظه‌ای</th>
                  <th className="py-3 px-4 font-semibold text-end">میانگین بهای خرید</th>
                  <th className="py-3 px-4 font-semibold text-end">ارزش روز</th>
                  <th className="py-3 px-6 font-semibold text-end">سود / زیان دفتری</th>
                  <th className="py-3 px-4 font-semibold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPositions.map((pos) => {
                  const pnl = parseFloat(pos.unrealized_pnl);
                  const pnlPct = parseFloat(pos.unrealized_pnl_percent);
                  const isPositive = pnl >= 0;

                  return (
                    <tr
                      key={pos.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                            {pos.asset_symbol.slice(0, 3)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block font-mono">
                              {pos.asset_symbol}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {pos.asset_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-start">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {CLASS_LABELS[pos.asset_class.toUpperCase()] || pos.asset_class}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-end font-medium text-slate-800 dark:text-slate-200 font-mono">
                        {parseFloat(pos.quantity).toLocaleString("en-US", {
                          maximumFractionDigits: 6,
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-end font-medium text-slate-800 dark:text-slate-200 font-mono">
                        {formatMoney(pos.current_price)}
                      </td>

                      <td className="py-3.5 px-4 text-end text-slate-500 font-mono">
                        {formatMoney(pos.average_cost_basis)}
                      </td>

                      <td className="py-3.5 px-4 text-end font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatMoney(pos.current_value)}
                      </td>

                      <td className="py-3.5 px-6 text-end">
                        <div
                          className={`inline-flex items-center gap-1 font-semibold font-mono ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{formatMoney(pnl)}</span>
                          <span className="text-[11px]">({formatPercent(pnlPct)})</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Position */}
                          <button
                            onClick={() => handleOpenEdit(pos)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                            title="ویرایش تعداد یا میانگین بهای خرید"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Position */}
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `آیا از حذف موقعیت دارایی «${pos.asset_symbol} - ${pos.asset_name}» از پورتفوی خود مطمئن هستید؟`
                                )
                              ) {
                                deleteMutation.mutate(pos.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                            title="حذف موقعیت از پورتفوی"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Portfolio Position Modal */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-sky-500" />
                  <span>ویرایش موقعیت دارایی ({editingPosition.asset_symbol})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تنظیم موجودی، تعداد یا میانگین بهای خرید در پورتفوی
                </p>
              </div>
              <button
                onClick={() => setEditingPosition(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="mt-4 space-y-4 text-xs"
            >
              {/* Asset Info Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                    {editingPosition.asset_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    نماد: {editingPosition.asset_symbol} ({CLASS_LABELS[editingPosition.asset_class.toUpperCase()] || editingPosition.asset_class})
                  </span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block">نرخ لحظه‌ای بازار</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs">
                    {formatMoney(editingPosition.current_price)}
                  </span>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300 block">
                  تعداد / حجم موجودی در پورتفوی
                </label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                  placeholder="مثلاً 10 یا 2.5"
                  required
                />
              </div>

              {/* Average Cost Basis Input */}
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300 block">
                  میانگین بهای خرید واحد ({editingPosition.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={editCostBasis}
                  onChange={(e) => setEditCostBasis(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                  placeholder="0"
                  required
                />
                {editCostBasis && !isNaN(parseFloat(editCostBasis)) && (
                  <span className="text-[11px] text-slate-400 block font-mono">
                    معادل: {parseFloat(editCostBasis).toLocaleString()} {editingPosition.currency === "TOMAN" ? "تومان" : editingPosition.currency}
                  </span>
                )}
              </div>

              {/* Live Preview Box */}
              {(() => {
                const q = parseFloat(editQuantity) || 0;
                const cb = parseFloat(editCostBasis) || 0;
                const cp = parseFloat(editingPosition.current_price) || 0;
                const newCost = q * cb;
                const newVal = q * cp;
                const newPnl = newVal - newCost;
                const isPos = newPnl >= 0;

                return (
                  <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 space-y-1.5">
                    <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 block">
                      پیش‌نمایش محاسبات پورتفوی:
                    </span>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">بهای تمام‌شده</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          {formatMoney(newCost)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">ارزش روز</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          {formatMoney(newVal)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">سود / زیان</span>
                        <span className={`font-bold text-[11px] ${isPos ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatMoney(newPnl)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPosition(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>ذخیره تغییرات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

