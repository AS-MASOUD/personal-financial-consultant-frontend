import {
  Account,
  AIConversation,
  AIMessage,
  AmortizationScheduleItem,
  Asset,
  AssetClass,
  AssetPosition,
  CashflowCategory,
  CashflowEntry,
  CashflowSummary,
  FinancialGoal,
  GoalCategory,
  HistoricalSnapshot,
  Liability,
  LiabilityPayment,
  LiabilityTypeConfig,
  MarketQuote,
  MarketRatesResponse,
  MarketSyncResultResponse,
  OverviewDashboard,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  Transaction,
  WealthTrajectoryResponse,
} from "@/types/financial";
import {
  AuthResponse,
  FinancialOnboardingInput,
  FinancialOnboardingResponse,
  JobBenchmarkResponse,
  NotificationItem,
  NotificationListResponse,
  OTPResponse,
  ProfileUpdateInput,
  RegisterRequestOTPInput,
  RegisterVerifyOTPInput,
  RiskAssessmentInput,
  RiskOnboardingResponse,
  RoleDefinition,
  SystemRole,
  User,
  UserCreateInput,
  UserListResponse,
  UserUpdateInput,
} from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "pfc_access_token";

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  remove: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/v1${endpoint}`;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = "API request failed";
    let errorCode = "";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || response.statusText;
      errorCode = errorJson?.error?.code || "";
    } catch {
      errorDetail = response.statusText;
    }
    const err = new Error(errorDetail) as Error & { code?: string; status?: number };
    err.code = errorCode;
    err.status = response.status;
    throw err;
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

  // Authentication & Identity
  login: (credentials: { identifier?: string; email?: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  requestOTP: (identifier: string) =>
    request<OTPResponse>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),

  verifyOTP: (identifier: string, code: string) =>
    request<AuthResponse>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ identifier, code }),
    }),

  register: (payload: { email?: string; phone_number?: string; password?: string; full_name: string; code?: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  requestRegisterOTP: (payload: RegisterRequestOTPInput) =>
    request<OTPResponse>("/auth/register/otp/request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyRegisterOTP: (payload: RegisterVerifyOTPInput) =>
    request<AuthResponse>("/auth/register/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>("/auth/me"),

  updateProfile: (payload: ProfileUpdateInput) =>
    request<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { old_password: string; new_password: string }) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refreshToken: () =>
    request<AuthResponse>("/auth/refresh", {
      method: "POST",
    }),

  submitFinancialOnboarding: (payload: FinancialOnboardingInput) =>
    request<FinancialOnboardingResponse>("/auth/onboarding/financial", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getJobBenchmark: (job: string, salary: number) => {
    const query = new URLSearchParams({ job, salary: String(salary) });
    return request<JobBenchmarkResponse>(`/auth/benchmark?${query.toString()}`);
  },

  submitRiskOnboarding: (payload: RiskAssessmentInput) =>
    request<RiskOnboardingResponse>("/auth/onboarding/risk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Notifications & Market Alerts
  getNotifications: (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.offset) query.append("offset", String(params.offset));
    if (params?.unread_only !== undefined) query.append("unread_only", String(params.unread_only));
    const qs = query.toString();
    return request<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ""}`);
  },

  markNotificationRead: (id: string) =>
    request<NotificationItem>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    request<{ marked_count: number }>("/notifications/read-all", {
      method: "POST",
    }),

  checkMarketTriggers: () =>
    request<NotificationItem[]>("/notifications/check-triggers", {
      method: "POST",
    }),

  // System Role & User Management
  getRoles: () => request<RoleDefinition[]>("/users/roles"),

  getUsers: (params?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.role) query.append("role", params.role);
    if (params?.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.offset) query.append("offset", String(params.offset));
    const qs = query.toString();
    return request<UserListResponse>(`/users${qs ? `?${qs}` : ""}`);
  },

  getUser: (id: string) => request<User>(`/users/${id}`),

  createUser: (data: UserCreateInput) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUserRole: (id: string, role: SystemRole) =>
    request<User>(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  updateUserStatus: (id: string, isActive: boolean) =>
    request<User>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),

  updateUser: (id: string, data: UserUpdateInput) =>
    request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, {
      method: "DELETE",
    }),

  // Overview & Analytics
  getOverview: () => request<OverviewDashboard>("/analytics/overview"),
  getSnapshots: (limit = 90) => request<HistoricalSnapshot[]>(`/analytics/snapshots?limit=${limit}`),
  recordSnapshot: () => request<HistoricalSnapshot>("/analytics/snapshots/record", { method: "POST" }),
  getWealthTrajectory: (params?: { history_days?: number; forecast_months?: number; annual_growth_override?: number }) => {
    const query = new URLSearchParams();
    if (params?.history_days) query.append("history_days", String(params.history_days));
    if (params?.forecast_months) query.append("forecast_months", String(params.forecast_months));
    if (params?.annual_growth_override) query.append("annual_growth_override", String(params.annual_growth_override));
    const qs = query.toString();
    return request<WealthTrajectoryResponse>(`/analytics/wealth-trajectory${qs ? `?${qs}` : ""}`);
  },

  // Accounts
  getAccounts: (activeOnly = false) =>
    request<Account[]>(`/accounts${activeOnly ? "?active_only=true" : ""}`),
  getAccount: (id: string) => request<Account>(`/accounts/${id}`),
  createAccount: (data: Partial<Account> & { initial_balance: string }) =>
    request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  deleteAccount: (id: string) => request<void>(`/accounts/${id}`, { method: "DELETE" }),

  // Assets & Positions
  getAssetClasses: () => request<AssetClass[]>("/assets/classes"),
  getAssets: (filter?: string | { asset_class?: string; is_active?: boolean }) => {
    const query = new URLSearchParams();
    if (typeof filter === "string") {
      if (filter) query.append("asset_class", filter);
    } else if (filter) {
      if (filter.asset_class) query.append("asset_class", filter.asset_class);
      if (filter.is_active !== undefined) query.append("is_active", String(filter.is_active));
    }
    const qs = query.toString();
    return request<Asset[]>(`/assets${qs ? `?${qs}` : ""}`);
  },
  getPositions: (accountId?: string) =>
    request<AssetPosition[]>(`/assets/positions${accountId ? `?account_id=${accountId}` : ""}`),
  updatePosition: (
    id: string,
    data: { quantity?: string | number; average_cost_basis?: string | number }
  ) =>
    request<AssetPosition>(`/assets/positions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePosition: (id: string) =>
    request<void>(`/assets/positions/${id}`, { method: "DELETE" }),
  createAsset: (data: Partial<Asset> & { initial_price: string }) =>
    request<Asset>("/assets", { method: "POST", body: JSON.stringify(data) }),
  updateAsset: (id: string, data: Partial<Asset> & Record<string, unknown>) =>
    request<Asset>(`/assets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAsset: (id: string) => request<void>(`/assets/${id}`, { method: "DELETE" }),
  getMarketRates: () => request<MarketRatesResponse>("/assets/market/rates"),
  syncMarketRates: () => request<MarketSyncResultResponse>("/assets/market/sync", { method: "POST" }),

  // Transactions
  getTransactions: (limit = 50, offset = 0) =>
    request<Transaction[]>(`/transactions?limit=${limit}&offset=${offset}`),
  createTransaction: (data: Record<string, unknown>) =>
    request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),

  // Liabilities
  getLiabilities: () => request<Liability[]>("/liabilities"),
  getLiabilityTypes: () => request<LiabilityTypeConfig[]>("/liabilities/types"),
  getLiabilityLabels: () => request<Record<string, string>>("/liabilities/labels"),
  createLiability: (data: Record<string, unknown>) =>
    request<Liability>("/liabilities", { method: "POST", body: JSON.stringify(data) }),
  updateLiability: (id: string, data: Record<string, unknown>) =>
    request<Liability>(`/liabilities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteLiability: (id: string) =>
    request<void>(`/liabilities/${id}`, { method: "DELETE" }),
  getLiabilityPayments: (id: string) =>
    request<LiabilityPayment[]>(`/liabilities/${id}/payments`),
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
  getGoalCategories: () => request<GoalCategory[]>("/goals/categories"),
  getGoals: () => request<FinancialGoal[]>("/goals"),
  createGoal: (data: Record<string, unknown>) =>
    request<FinancialGoal>("/goals", { method: "POST", body: JSON.stringify(data) }),
  updateGoal: (id: string, data: Record<string, unknown>) =>
    request<FinancialGoal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGoal: (id: string) =>
    request<void>(`/goals/${id}`, { method: "DELETE" }),

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
