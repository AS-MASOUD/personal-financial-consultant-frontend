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
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface ProfileUpdateInput {
  full_name?: string;
  email?: string | null;
  phone_number?: string | null;
  age?: number | null;
  job?: string | null;
  bio?: string | null;
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
