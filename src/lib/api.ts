import {
  Account,
  AIConversation,
  AIMessage,
  AmortizationScheduleItem,
  Asset,
  AssetPosition,
  CashflowCategory,
  CashflowEntry,
  CashflowSummary,
  FinancialGoal,
  HistoricalSnapshot,
  Liability,
  LiabilityPayment,
  OverviewDashboard,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  Transaction,
} from "@/types/financial";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/v1${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = "API request failed";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // Health
  checkLive: () => fetch(`${API_BASE}/health/live`).then((r) => r.json()),
  checkReady: () => fetch(`${API_BASE}/health/ready`).then((r) => r.json()),

  // Overview & Analytics
  getOverview: () => request<OverviewDashboard>("/analytics/overview"),
  getSnapshots: (limit = 90) => request<HistoricalSnapshot[]>(`/analytics/snapshots?limit=${limit}`),
  recordSnapshot: () => request<HistoricalSnapshot>("/analytics/snapshots/record", { method: "POST" }),

  // Accounts
  getAccounts: (activeOnly = false) =>
    request<Account[]>(`/accounts${activeOnly ? "?active_only=true" : ""}`),
  getAccount: (id: string) => request<Account>(`/accounts/${id}`),
  createAccount: (data: Partial<Account> & { initial_balance: string }) =>
    request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  deleteAccount: (id: string) => request<void>(`/accounts/${id}`, { method: "DELETE" }),

  // Assets & Positions
  getAssets: (assetClass?: string) =>
    request<Asset[]>(`/assets${assetClass ? `?asset_class=${assetClass}` : ""}`),
  getPositions: (accountId?: string) =>
    request<AssetPosition[]>(`/assets/positions${accountId ? `?account_id=${accountId}` : ""}`),
  createAsset: (data: Partial<Asset> & { initial_price: string }) =>
    request<Asset>("/assets", { method: "POST", body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (limit = 50, offset = 0) =>
    request<Transaction[]>(`/transactions?limit=${limit}&offset=${offset}`),
  createTransaction: (data: Record<string, unknown>) =>
    request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),

  // Liabilities
  getLiabilities: () => request<Liability[]>("/liabilities"),
  createLiability: (data: Record<string, unknown>) =>
    request<Liability>("/liabilities", { method: "POST", body: JSON.stringify(data) }),
  recordLoanPayment: (data: Record<string, unknown>) =>
    request<LiabilityPayment>("/liabilities/payments", { method: "POST", body: JSON.stringify(data) }),
  calculateAmortization: (principal: number, interestRate: number, termMonths: number) =>
    request<AmortizationScheduleItem[]>(
      `/liabilities/calculate-schedule?principal=${principal}&interest_rate=${interestRate}&term_months=${termMonths}`
    ),

  // Cashflow
  getCategories: (flowType?: string) =>
    request<CashflowCategory[]>(`/cashflow/categories${flowType ? `?flow_type=${flowType}` : ""}`),
  getEntries: (limit = 50) => request<CashflowEntry[]>(`/cashflow/entries?limit=${limit}`),
  getCashflowSummary: () => request<CashflowSummary>("/cashflow/summary"),
  createEntry: (data: Record<string, unknown>) =>
    request<CashflowEntry>("/cashflow/entries", { method: "POST", body: JSON.stringify(data) }),

  // Goals
  getGoals: () => request<FinancialGoal[]>("/goals"),
  createGoal: (data: Record<string, unknown>) =>
    request<FinancialGoal>("/goals", { method: "POST", body: JSON.stringify(data) }),

  // Scenarios
  simulateScenario: (payload: ScenarioSimulationRequest) =>
    request<ScenarioSimulationResponse>("/scenarios/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // AI Assistant
  getAIConversations: () => request<AIConversation[]>("/ai/conversations"),
  getAIConversation: (id: string) => request<AIConversation>(`/ai/conversations/${id}`),
  sendAIChat: (content: string, conversationId?: string) =>
    request<AIMessage>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ content, conversation_id: conversationId }),
    }),
};
