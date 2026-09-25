"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useCurrency } from "@/components/currency-provider";

interface NetWorthChartProps {
  data: Array<{
    snapshot_date: string;
    net_worth: string | number;
    total_assets: string | number;
    total_liabilities: string | number;
  }>;
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  const [range, setRange] = useState<"30D" | "90D" | "ALL">("90D");
  const { formatMoney } = useCurrency();

  const formattedData = React.useMemo(() => {
    if (!data) return [];
    let slice = [...data];
    if (range === "30D") slice = slice.slice(-10);
    else if (range === "90D") slice = slice.slice(-30);

    return slice.map((item) => ({
      date: item.snapshot_date ? item.snapshot_date.slice(5) : "",
      netWorth: typeof item.net_worth === "string" ? parseFloat(item.net_worth) : item.net_worth,
      assets: typeof item.total_assets === "string" ? parseFloat(item.total_assets) : item.total_assets,
      liabilities:
        typeof item.total_liabilities === "string"
          ? parseFloat(item.total_liabilities)
          : item.total_liabilities,
    }));
  }, [data, range]);

  return (
    <div className="fin-card p-5 flex flex-col justify-between h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            روند ارزش خالص (Net Worth)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سیر تاریخی تغییرات ارزش پورتفولیو و تعهدات بدهی
          </p>
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          {[
            { label: "۳۰ روزه", value: "30D" as const },
            { label: "۹۰ روزه", value: "90D" as const },
            { label: "کل دوره", value: "ALL" as const },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                range === r.value
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            هنوز اسنپ‌شات تاریخی ثبت نشده است.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 text-right" dir="rtl">
                        <div className="font-semibold text-slate-300">{label}</div>
                        <div className="text-sky-400 font-bold">
                          ارزش خالص: {formatMoney(payload[0]?.value as number)}
                        </div>
                        {payload[1] && (
                          <div className="text-emerald-400">
                            کل دارایی‌ها: {formatMoney(payload[1]?.value as number)}
                          </div>
                        )}
                        {payload[2] && (
                          <div className="text-rose-400">
                            کل بدهی‌ها: {formatMoney(payload[2]?.value as number)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const ALLOCATION_COLORS = [
  "#3b82f6", // Cash
  "#10b981", // Equity
  "#8b5cf6", // Crypto
  "#f59e0b", // Commodity
  "#ec4899", // Fixed income
  "#06b6d4", // Real estate
  "#64748b", // Other
];

const CATEGORY_FA: Record<string, string> = {
  Cash: "نقدینگی و سپرده",
  Equity: "سهام و صندوق‌ها",
  Crypto: "ارزهای دیجیتال",
  Commodity: "کالا و طلا",
  "Fixed Income": "اوراق درآمد ثابت",
  "Real Estate": "املاک و مستغلات",
  Other: "سایر دارایی‌ها",
  equity: "سهام و صندوق‌ها",
  crypto: "ارزهای دیجیتال",
  cash: "نقدینگی و سپرده",
  commodity: "کالا و طلا",
  fixed_income: "اوراق درآمد ثابت",
  real_estate: "املاک و مستغلات",
};

interface AllocationDonutProps {
  data: Array<{ category: string; amount: number; percentage: number }>;
}

export function AllocationDonut({ data }: AllocationDonutProps) {
  const chartData = data && data.length > 0 ? data : [];
  const { formatMoney } = useCurrency();

  return (
    <div className="fin-card p-5 flex flex-col justify-between h-[360px]">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          ترکیب و تخصیص دارایی‌ها
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          توزیع سرمایه میان طبقات دارایی و پوزیشن‌ها
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 mt-2">
        <div className="h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="amount"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) => [formatMoney(Number(value)), "ارزش روز"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Clean Categorical Legend */}
        <div className="flex-1 w-full space-y-1.5 overflow-y-auto max-h-[190px] ps-1">
          {chartData.map((item, idx) => (
            <div
              key={item.category}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
                  }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {CATEGORY_FA[item.category] || item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  %{item.percentage.toFixed(1)}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {formatMoney(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
