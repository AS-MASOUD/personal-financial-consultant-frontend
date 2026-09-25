"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTransactionModal({ isOpen, onClose }: QuickTransactionModalProps) {
  const queryClient = useQueryClient();

  const [txType, setTxType] = useState<string>("DEPOSIT");
  const [accountId, setAccountId] = useState<string>("");
  const [assetId, setAssetId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [fee, setFee] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.getAccounts(),
    enabled: isOpen,
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.getAssets(),
    enabled: isOpen && (txType === "BUY" || txType === "SELL" || txType === "DIVIDEND"),
  });

  const selectedAccountId = accountId || (accounts && accounts.length > 0 ? accounts[0].id : "");
  const selectedAssetId = assetId || (assets && assets.length > 0 ? assets[0].id : "");

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const q = parseFloat(val);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p) && (txType === "BUY" || txType === "SELL")) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const q = parseFloat(quantity);
    const p = parseFloat(val);
    if (!isNaN(q) && !isNaN(p) && (txType === "BUY" || txType === "SELL")) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleAssetChange = (val: string) => {
    setAssetId(val);
    const selected = assets?.find((a) => a.id === val);
    if (selected) {
      setUnitPrice(selected.current_price);
      const q = parseFloat(quantity);
      const p = parseFloat(selected.current_price);
      if (!isNaN(q) && !isNaN(p) && (txType === "BUY" || txType === "SELL")) {
        setAmount((q * p).toFixed(2));
      }
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (!selectedAccountId) throw new Error("Please select an account.");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Please enter a valid amount.");

      const payload: Record<string, unknown> = {
        account_id: selectedAccountId,
        transaction_type: txType,
        transaction_date: new Date().toISOString(),
        total_amount: amount,
        fee: fee || "0",
        currency: "USD",
        notes: notes || undefined,
      };

      if (txType === "BUY" || txType === "SELL") {
        if (!selectedAssetId) throw new Error("Please select an asset.");
        if (!quantity || parseFloat(quantity) <= 0) throw new Error("Please enter a valid quantity.");
        payload.asset_id = selectedAssetId;
        payload.quantity = quantity;
        payload.unit_price = unitPrice || (parseFloat(amount) / parseFloat(quantity)).toFixed(4);
      }

      return api.createTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
      // Reset form
      setAmount("");
      setQuantity("");
      setUnitPrice("");
      setNotes("");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to record transaction";
      setErrorMsg(msg);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="fin-card w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            ثبت تراکنش جدید
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div className="mt-4 grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          {[
            { id: "DEPOSIT", label: "واریز" },
            { id: "WITHDRAWAL", label: "برداشت" },
            { id: "BUY", label: "خرید" },
            { id: "SELL", label: "فروش" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTxType(item.id)}
              className={`py-1.5 rounded-md transition-all ${
                txType === item.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-3 text-xs"
        >
          {/* Target Account */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              حساب بانکی یا کارگزاری
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.institution || acc.account_type}) - ${parseFloat(acc.current_balance).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional: Asset Selection for BUY/SELL */}
          {(txType === "BUY" || txType === "SELL") && (
            <>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  نماد یا نام دارایی
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {assets?.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.symbol} - {asset.name} (${parseFloat(asset.current_price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    تعداد / حجم
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="مثلاً 5"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="مثلاً 210.50"
                    value={unitPrice}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Total Amount & Fee */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                مبلغ کل ($)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                کارمزد معامله ($)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              یادداشت (اختیاری)
            </label>
            <input
              type="text"
              placeholder="مثلاً خرید پله‌ای ماهانه، واریز سود"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>تأیید و ثبت تراکنش</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
