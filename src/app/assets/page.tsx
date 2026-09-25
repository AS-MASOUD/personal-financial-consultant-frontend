"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, Check, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetClass, setAssetClass] = useState("equity");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.getAssets(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createAsset({
        symbol: symbol.toUpperCase(),
        name,
        asset_class: assetClass,
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
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Tracked Assets & Instruments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Equities, ETFs, commodities, bonds, and crypto tickers
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Asset Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="fin-card h-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {asset.symbol}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    {asset.asset_class}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2.5">
                  {asset.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Current Quote
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(asset.current_price)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {asset.price_updated_at ? formatDate(asset.price_updated_at) : "Active"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Register New Asset
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
                  Ticker / Symbol (e.g. VTI, BTC)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPY"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Asset Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPDR S&P 500 ETF Trust"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Asset Class
                  </label>
                  <select
                    value={assetClass}
                    onChange={(e) => setAssetClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="equity">Equity / Stock</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="commodity">Commodity</option>
                    <option value="fixed_income">Bond / Fixed Income</option>
                    <option value="real_estate">Real Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Market Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Thesis (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Investment notes or strategy details"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Save Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
