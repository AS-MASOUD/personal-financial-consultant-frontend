import { AssetPosition } from "@/types/financial";

export interface AllocationCategoryComparison {
  key: string;
  label: string;
  targetPercent: number;
  actualPercent: number;
  actualAmount: number;
  isExceeded: boolean;
  excessPercent: number;
  color: string;
}

export interface PortfolioAllocationCompliance {
  totalValue: number;
  items: AllocationCategoryComparison[];
  hasExceededCategory: boolean;
  exceededItems: AllocationCategoryComparison[];
}

export const STANDARD_ALLOCATION_CATEGORIES = [
  { key: "equities", label: "سهام و ETF", color: "blue", assetClasses: ["equity", "real_estate"] },
  { key: "gold", label: "طلا و کالاها", color: "amber", assetClasses: ["commodity"] },
  { key: "fixed_income", label: "درآمد ثابت", color: "emerald", assetClasses: ["fixed_income"] },
  { key: "crypto", label: "رمزارز", color: "violet", assetClasses: ["crypto"] },
  { key: "cash", label: "نقدینگی و ارز", color: "slate", assetClasses: ["cash"] },
];

export function calculatePortfolioAllocationCompliance(
  positions: AssetPosition[] | undefined | null,
  targetAllocation: Record<string, number> | undefined | null
): PortfolioAllocationCompliance {
  const target = targetAllocation || {
    equities: 40,
    gold: 20,
    fixed_income: 20,
    crypto: 10,
    cash: 10,
  };

  const totalValue = (positions || []).reduce(
    (sum, p) => sum + (parseFloat(p.current_value) || 0),
    0
  );

  const actualAmounts: Record<string, number> = {
    equities: 0,
    gold: 0,
    fixed_income: 0,
    crypto: 0,
    cash: 0,
  };

  if (positions && positions.length > 0) {
    for (const p of positions) {
      const cls = (p.asset_class || "").toLowerCase();
      const val = parseFloat(p.current_value) || 0;

      if (cls === "equity" || cls === "real_estate") {
        actualAmounts.equities += val;
      } else if (cls === "commodity") {
        actualAmounts.gold += val;
      } else if (cls === "fixed_income") {
        actualAmounts.fixed_income += val;
      } else if (cls === "crypto") {
        actualAmounts.crypto += val;
      } else if (cls === "cash") {
        actualAmounts.cash += val;
      } else {
        actualAmounts.cash += val;
      }
    }
  }

  const items: AllocationCategoryComparison[] = STANDARD_ALLOCATION_CATEGORIES.map((cat) => {
    let targetPct = target[cat.key];
    if (targetPct === undefined && cat.key === "gold") {
      targetPct = target["gold_commodity"] ?? 0;
    }
    targetPct = targetPct ?? 0;

    const amount = actualAmounts[cat.key] || 0;
    const actualPct = totalValue > 0 ? (amount / totalValue) * 100 : 0;
    
    // Exceeded if target limit > 0 and actual % exceeds target limit + 0.1% buffer
    const isExceeded = targetPct > 0 && actualPct > targetPct + 0.1;
    const excessPercent = isExceeded ? actualPct - targetPct : 0;

    return {
      key: cat.key,
      label: cat.label,
      targetPercent: targetPct,
      actualPercent: actualPct,
      actualAmount: amount,
      isExceeded,
      excessPercent,
      color: cat.color,
    };
  });

  const exceededItems = items.filter((i) => i.isExceeded);

  return {
    totalValue,
    items,
    hasExceededCategory: exceededItems.length > 0,
    exceededItems,
  };
}
