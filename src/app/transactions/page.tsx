"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.getTransactions(100),
  });

  const filtered = React.useMemo(() => {
    if (!transactions) return [];
    if (filterType === "ALL") return transactions;
    return transactions.filter((t) => t.transaction_type === filterType);
  }, [transactions, filterType]);

  const types = ["ALL", "DEPOSIT", "WITHDRAWAL", "BUY", "SELL", "DIVIDEND"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Transaction Activity Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable audit record of all deposits, withdrawals, buys, and distributions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold overflow-x-auto max-w-full">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
                filterType === t
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="fin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Quantity / Units</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-4 font-semibold text-right">Fee</th>
                <th className="py-3 px-6 font-semibold text-right">Total Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isPositiveFlow =
                    tx.transaction_type === "DEPOSIT" ||
                    tx.transaction_type === "SELL" ||
                    tx.transaction_type === "DIVIDEND";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isPositiveFlow
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isPositiveFlow ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {tx.transaction_type}
                            </span>
                            {tx.notes && (
                              <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {formatDate(tx.transaction_date)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {tx.quantity ? parseFloat(tx.quantity).toLocaleString() : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {tx.unit_price ? formatCurrency(tx.unit_price) : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {parseFloat(tx.fee) > 0 ? formatCurrency(tx.fee) : "—"}
                      </td>

                      <td className="py-3.5 px-6 text-right font-bold text-sm">
                        <span
                          className={
                            isPositiveFlow
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-900 dark:text-slate-100"
                          }
                        >
                          {isPositiveFlow ? "+" : "-"}
                          {formatCurrency(tx.total_amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Settled
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
