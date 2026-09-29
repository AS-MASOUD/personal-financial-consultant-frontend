export type SystemRole = "sysmanager" | "admin" | "user" | "viewer";

export interface User {
  id: string;
  email?: string | null;
  phone_number?: string | null;
  full_name: string;
  role: SystemRole;
  age?: number | null;
  job?: string | null;
  bio?: string | null;
  monthly_income?: number | string | null;
  liquid_assets?: number | string | null;
  investment_assets?: number | string | null;
  total_liabilities?: number | string | null;
  financial_goals?: string[] | null;
  has_completed_financial_onboarding?: boolean;
  risk_score?: number | null;
  risk_level?: string | null;
  risk_answers?: Record<string, number> | null;
  portfolio_suggestion?: Record<string, number> | null;
  has_completed_risk_onboarding?: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface JobBenchmarkResponse {
  job_category: string;
  average_salary_toman: number | string;
  min_salary_toman: number | string;
  max_salary_toman: number | string;
  user_salary_toman: number | string;
  comparison_ratio_percent: number;
  status_fa: string;
  suggestion_fa: string;
}

export interface FinancialOnboardingInput {
  job: string;
  monthly_income: number;
  liquid_assets: number;
  investment_assets: number;
  total_liabilities: number;
  financial_goals: string[];
}

export interface FinancialOnboardingResponse {
  user: User;
  benchmark: JobBenchmarkResponse;
  message: string;
}

export interface RiskAssessmentInput {
  answers: Record<string, number>;
  custom_portfolio_allocation?: Record<string, number>;
}

export interface RiskAssessmentResult {
  total_score: number;
  risk_level: string;
  risk_title_fa: string;
  description_fa: string;
  portfolio_suggestion: Record<string, number>;
}

export interface RiskOnboardingResponse {
  user: User;
  risk_result: RiskAssessmentResult;
  message: string;
}

export interface ProfileUpdateInput {
  full_name?: string;
  email?: string | null;
  phone_number?: string | null;
  age?: number | null;
  job?: string | null;
  bio?: string | null;
  portfolio_suggestion?: Record<string, number>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface OTPResponse {
  identifier: string;
  channel: "sms" | "email" | string;
  expires_in: number;
  cooldown_seconds: number;
  debug_code?: string | null;
  message: string;
}

export interface RegisterRequestOTPInput {
  full_name: string;
  phone_number: string;
  email?: string;
  password?: string;
}

export interface RegisterVerifyOTPInput {
  full_name: string;
  phone_number: string;
  email?: string;
  password?: string;
  code: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  notification_type: string;
  severity: "info" | "warning" | "success" | "critical";
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  unread_count: number;
  total: number;
  items: NotificationItem[];
}

export interface RoleDefinition {
  role: SystemRole;
  name_fa: string;
  name_en: string;
  description_fa: string;
  description_en: string;
  badge_color: string;
  permissions: string[];
}

export interface UserListResponse {
  total: number;
  page: number;
  limit: number;
  items: User[];
}

export interface UserCreateInput {
  email?: string;
  phone_number?: string;
  password?: string;
  full_name: string;
  role: SystemRole;
  is_active?: boolean;
}

export interface UserUpdateInput {
  full_name?: string;
  email?: string;
  phone_number?: string;
  role?: SystemRole;
  is_active?: boolean;
  password?: string;
}
