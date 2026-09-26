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
import {
  AuthResponse,
  NotificationItem,
  NotificationListResponse,
  OTPResponse,
  ProfileUpdateInput,
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

  register: (payload: { email?: string; phone_number?: string; password?: string; full_name: string }) =>
    request<AuthResponse>("/auth/register", {
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
