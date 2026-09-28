export interface Account {
  id: string;
  name: string;
  account_type: string;
  institution?: string | null;
  currency: string;
  current_balance: string;
  is_active: boolean;
  account_number_mask?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_class: string;
  currency: string;
  current_price: string;
  price_updated_at?: string | null;
  notes?: string | null;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  name_en?: string | null;
  category: "gold_coin" | "commodity" | "currency" | "crypto" | string;
  price: number | string;
  unit: string;
  change_percent?: number | null;
  price_toman?: number | string | null;
  updated_at?: string | null;
}

export interface MarketRatesResponse {
  gold_and_coins: MarketQuote[];
  commodities: MarketQuote[];
  currencies: MarketQuote[];
  cryptocurrency: MarketQuote[];
  usd_toman_rate?: number | string | null;
  last_sync_time?: string | null;
  sync_source: string;
}

export interface MarketSyncResultResponse {
  success: boolean;
  message: string;
  updated_assets_count: number;
  total_quotes_fetched: number;
  last_sync_time: string;
}

export interface AssetPosition {
  id: string;
  account_id: string;
  asset_id: string;
  quantity: string;
  average_cost_basis: string;
  current_price: string;
  current_value: string;
  unrealized_pnl: string;
  unrealized_pnl_percent: string;
  asset_symbol: string;
  asset_name: string;
  asset_class: string;
  currency: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  asset_id?: string | null;
  transaction_type: string;
  transaction_date: string;
  quantity?: string | null;
  unit_price?: string | null;
  total_amount: string;
  fee: string;
  currency: string;
  notes?: string | null;
  is_reconciled: boolean;
  created_at: string;
}

export interface Liability {
  id: string;
  name: string;
  liability_type: string;
  lender?: string | null;
  original_principal: string;
  current_balance: string;
  interest_rate_percent: string;
  monthly_payment: string;
  start_date: string;
  maturity_date?: string | null;
  currency: string;
  repaid_amount: string;
  repaid_percent: string;
  created_at: string;
}

export interface AmortizationScheduleItem {
  month: number;
  payment: string | number;
  principal: string | number;
  interest: string | number;
  remaining_balance: string | number;
}

export interface LiabilityPayment {
  id: string;
  liability_id: string;
  payment_date: string;
  amount: string;
  principal_portion: string;
  interest_portion: string;
  notes?: string | null;
}

export interface CashflowCategory {
  id: string;
  name: string;
  flow_type: "income" | "expense";
  color_hex: string;
  icon: string;
  monthly_budget?: string | null;
}

export interface CashflowEntry {
  id: string;
  account_id?: string | null;
  category_id: string;
  flow_type: "income" | "expense";
  amount: string;
  currency: string;
  entry_date: string;
  description: string;
  is_recurring: boolean;
  category_name?: string | null;
  category_color?: string | null;
}

export interface CashflowSummary {
  total_income: string;
  total_expenses: string;
  net_savings: string;
  savings_rate_percent: string;
  categories_breakdown: Array<{
    category: string;
    color: string;
    flow_type: string;
    amount: number;
  }>;
}

export interface FinancialGoal {
  id: string;
  name: string;
  category: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  target_date: string;
  monthly_contribution: string;
  status: string;
  notes?: string | null;
  progress_percent: string;
  remaining_amount: string;
  projected_completion_date?: string | null;
}

export interface AttentionItem {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  category: string;
  action_link?: string | null;
}

export interface OverviewDashboard {
  net_worth: string;
  total_assets: string;
  total_liabilities: string;
  liquid_cash: string;
  invested_capital: string;
  currency: string;
  monthly_income: string;
  monthly_expenses: string;
  monthly_debt_service: string;
  monthly_free_cashflow: string;
  asset_allocation: Array<{ category: string; amount: number; percentage: number }>;
  liability_breakdown: Array<{ category: string; amount: number; percentage: number }>;
  attention_items: AttentionItem[];
  recent_transactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    currency: string;
    notes?: string;
  }>;
  upcoming_obligations: Array<{
    id: string;
    name: string;
    monthly_payment: number;
    remaining_balance: number;
    due_day: number;
  }>;
}

export interface HistoricalSnapshot {
  id: string;
  snapshot_date: string;
  total_assets: string;
  total_liabilities: string;
  net_worth: string;
  liquid_assets: string;
  currency: string;
}

export interface ScenarioSimulationRequest {
  name: string;
  horizon_months: number;
  monthly_income_delta: string;
  monthly_expense_delta: string;
  asset_growth_rate_annual: string;
  new_loan_amount: string;
  new_loan_rate_annual: string;
  new_loan_term_months: number;
  one_time_windfall: string;
}

export interface MonthlyProjection {
  month: number;
  projected_net_worth: string;
  projected_liquid_cash: string;
  projected_liabilities: string;
  projected_monthly_free_cashflow: string;
}

export interface ScenarioSimulationResponse {
  scenario_name: string;
  baseline_net_worth: string;
  final_projected_net_worth: string;
  net_worth_delta: string;
  baseline_monthly_cashflow: string;
  new_monthly_cashflow: string;
  new_loan_monthly_payment: string;
  monthly_projections: MonthlyProjection[];
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: Record<string, unknown>[] | Record<string, unknown> | null;
  tool_results?: Record<string, unknown>[] | Record<string, unknown> | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: AIMessage[];
}
