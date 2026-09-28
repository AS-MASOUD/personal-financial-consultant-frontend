"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  OTPResponse,
  ProfileUpdateInput,
  RegisterRequestOTPInput,
  RegisterVerifyOTPInput,
  SystemRole,
  User,
} from "@/types/auth";
import { api, tokenStorage } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSysManager: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  login: (credentials: { identifier?: string; email?: string; password: string }) => Promise<User>;
  requestOTP: (identifier: string) => Promise<OTPResponse>;
  loginWithOTP: (identifier: string, code: string) => Promise<User>;
  register: (payload: { email?: string; phone_number?: string; password?: string; full_name: string; code?: string }) => Promise<User>;
  requestRegisterOTP: (payload: RegisterRequestOTPInput) => Promise<OTPResponse>;
  registerWithOTP: (payload: RegisterVerifyOTPInput) => Promise<User>;
  updateProfile: (payload: ProfileUpdateInput) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasRole: (...roles: SystemRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = tokenStorage.get();
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    let isMounted = true;
    api
      .getMe()
      .then((userData) => {
        if (isMounted) setUser(userData);
      })
      .catch(() => {
        if (isMounted) {
          tokenStorage.remove();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: { identifier?: string; email?: string; password: string }): Promise<User> => {
      const response = await api.login(credentials);
      tokenStorage.set(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response.user;
    },
    []
  );

  const requestOTP = useCallback(async (identifier: string): Promise<OTPResponse> => {
    return await api.requestOTP(identifier);
  }, []);

  const loginWithOTP = useCallback(
    async (identifier: string, code: string): Promise<User> => {
      const response = await api.verifyOTP(identifier, code);
      tokenStorage.set(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response.user;
    },
    []
  );

  const register = useCallback(
    async (payload: { email?: string; phone_number?: string; password?: string; full_name: string; code?: string }): Promise<User> => {
      const response = await api.register(payload);
      tokenStorage.set(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response.user;
    },
    []
  );

  const requestRegisterOTP = useCallback(
    async (payload: RegisterRequestOTPInput): Promise<OTPResponse> => {
      return await api.requestRegisterOTP(payload);
    },
    []
  );

  const registerWithOTP = useCallback(
    async (payload: RegisterVerifyOTPInput): Promise<User> => {
      const response = await api.verifyRegisterOTP(payload);
      tokenStorage.set(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response.user;
    },
    []
  );

  const updateProfile = useCallback(
    async (payload: ProfileUpdateInput): Promise<User> => {
      const updated = await api.updateProfile(payload);
      setUser(updated);
      return updated;
    },
    []
  );

  const logout = useCallback(() => {
    tokenStorage.remove();
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshProfile = useCallback(async () => {
    if (!tokenStorage.get()) return;
    try {
      const updated = await api.getMe();
      setUser(updated);
    } catch {
      // Ignore refresh error
    }
  }, []);

  const hasRole = useCallback(
    (...roles: SystemRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      isSysManager: user?.role === "sysmanager",
      isAdmin: user?.role === "admin" || user?.role === "sysmanager",
      isViewer: user?.role === "viewer",
      login,
      requestOTP,
      loginWithOTP,
      register,
      requestRegisterOTP,
      registerWithOTP,
      updateProfile,
      logout,
      refreshProfile,
      hasRole,
    }),
    [
      user,
      token,
      isLoading,
      login,
      requestOTP,
      loginWithOTP,
      register,
      requestRegisterOTP,
      registerWithOTP,
      updateProfile,
      logout,
      refreshProfile,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
