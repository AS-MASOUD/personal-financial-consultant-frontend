"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { SystemRole, User, UserCreateInput } from "@/types/auth";
import {
  ShieldCheck,
  Shield,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  UserCheck,
  Building2,
  Eye,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function UsersPage() {
  const { user: currentUser, isSysManager, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [targetNewRole, setTargetNewRole] = useState<SystemRole>("user");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<SystemRole>("user");

  // Fetch Users
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", searchTerm, selectedRole, selectedStatus],
    queryFn: () =>
      api.getUsers({
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        is_active: selectedStatus === "" ? undefined : selectedStatus === "active",
      }),
    enabled: isSysManager,
  });

  // Fetch Role Definitions
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.getRoles(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: UserCreateInput) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateModalOpen(false);
      resetCreateForm();
      setActionSuccess("کاربر با موفقیت ایجاد شد.");
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: SystemRole }) =>
      api.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsRoleModalOpen(false);
      setSelectedUserForRole(null);
      setActionSuccess("نقش کاربر با موفقیت به‌روزرسانی شد.");
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionSuccess("وضعیت دسترسی حساب کاربری تغییر یافت.");
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionSuccess("کاربر با موفقیت از سیستم حذف شد.");
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const resetCreateForm = () => {
    setNewEmail("");
    setNewName("");
    setNewPassword("");
    setNewRole("user");
    setActionError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    createMutation.mutate({
      email: newEmail,
      full_name: newName,
      password: newPassword,
      role: newRole,
      is_active: true,
    });
  };

  const handleOpenRoleModal = (user: User) => {
    setSelectedUserForRole(user);
    setTargetNewRole(user.role);
    setActionError(null);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedUserForRole) return;
    setActionError(null);
    updateRoleMutation.mutate({
      id: selectedUserForRole.id,
      role: targetNewRole,
    });
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`آیا از حذف دائم کاربر "${user.full_name}" (${user.email}) اطمینان دارید؟`)) {
      setActionError(null);
      deleteMutation.mutate(user.id);
    }
  };

  // If user lacks permission
  if (!isSysManager && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <Shield className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            دسترسی محدود به مدیران سامانه
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            بخش «مدیریت کاربران و نقش‌های سیستمی» اختصاصاً در اختیار دارندگان نقش{" "}
            <strong className="text-purple-600 dark:text-purple-400">مدیر ارشد (SysManager)</strong>{" "}
            یا <strong className="text-sky-600 dark:text-sky-400">مدیر مالی (Admin)</strong> قرار
            دارد.
          </p>
        </div>
      </div>
    );
  }

  const usersList = usersData?.items || [];
  const totalCount = usersData?.total || usersList.length;
  const sysManagerCount = usersList.filter((u) => u.role === "sysmanager").length;
  const adminCount = usersList.filter((u) => u.role === "admin").length;
  const regularCount = usersList.filter((u) => u.role === "user" || u.role === "viewer").length;

  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case "sysmanager":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="h-3 w-3" />
            <span>مدیر ارشد (SysManager)</span>
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Building2 className="h-3 w-3" />
            <span>مدیر مالی (Admin)</span>
          </span>
        );
      case "user":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <UserCheck className="h-3 w-3" />
            <span>کاربر استاندارد (User)</span>
          </span>
        );
      case "viewer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Eye className="h-3 w-3" />
            <span>ناظر و بیننده (Viewer)</span>
          </span>
        );
    }
  };

  if (!isSysManager) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
          <Shield className="h-8 w-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            دسترسی انحصاری مدیر ارشد سامانه (SysManager)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            مدیریت کاربران، تغییر سطوح دسترسی و تخصیص نقش‌ها منحصراً در اختیار مدیر ارشد سامانه است.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-purple-500" />
            <span>مدیریت کاربران و نقش‌های سیستمی</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعیین و ارتقاء نقش‌های کاربری (SysManager، Admin، User، Viewer) و کنترل دسترسی‌ها
          </p>
        </div>

        {isSysManager && (
          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>افزودن کاربر جدید</span>
          </button>
        )}
      </div>

      {/* Success / Error Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              کل حساب‌های کاربری
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">{totalCount}</p>
          <span className="text-[11px] text-slate-400">ثبت‌شده در دیتابیس</span>
        </div>

        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              مدیران ارشد (SysManager)
            </span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-700 dark:text-purple-300">
            {sysManagerCount}
          </p>
          <span className="text-[11px] text-purple-500/70">دسترسی تام و تغییر نقش‌ها</span>
        </div>

        <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
              مدیران مالی (Admin)
            </span>
            <Building2 className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-sky-700 dark:text-sky-300">{adminCount}</p>
          <span className="text-[11px] text-sky-500/70">مدیریت اسناد، دارایی و بودجه</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              کاربران و ناظران
            </span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-300">
            {regularCount}
          </p>
          <span className="text-[11px] text-emerald-500/70">کاربران عادی و ناظران فقط‌خواندنی</span>
        </div>
      </div>

      {/* Role Definitions Guide Cards */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          ماتریس سطوح دسترسی و اختیارات نقش‌ها
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {rolesData?.map((r) => (
            <div
              key={r.role}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {r.name_fa}
                </span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.badge_color }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">
                {r.description_fa}
              </p>
              <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-900">
                {r.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={perm}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  >
                    {perm}
                  </span>
                ))}
                {r.permissions.length > 3 && (
                  <span className="text-[9px] text-slate-400 self-center">
                    +{r.permissions.length - 3} مورد دیگر
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام یا ایمیل کاربر..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">همه نقش‌ها</option>
            <option value="sysmanager">مدیر ارشد (SysManager)</option>
            <option value="admin">مدیر مالی (Admin)</option>
            <option value="user">کاربر عادی (User)</option>
            <option value="viewer">ناظر (Viewer)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="active">فقط حساب‌های فعال</option>
            <option value="inactive">فقط حساب‌های معلق</option>
          </select>

          <button
            onClick={() => refetch()}
            title="به‌روزرسانی فهرست"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3.5 pr-6">مشخصات کاربر</th>
                <th className="p-3.5">نقش سیستمی</th>
                <th className="p-3.5">وضعیت حساب</th>
                <th className="p-3.5">تاریخ ثبت‌نام</th>
                <th className="p-3.5">آخرین ورود</th>
                <th className="p-3.5 pl-6 text-center">عملیات مدیریتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    در حال بارگذاری کاربران...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    کاربری با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="p-3.5 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600/30 to-sky-600/30 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-slate-800 dark:text-slate-200">
                            {u.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {u.full_name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                  شما
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">{getRoleBadge(u.role)}</td>

                      {/* Status */}
                      <td className="p-3.5">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>فعال</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-500 font-medium">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span>معلق</span>
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString("fa-IR")}
                      </td>

                      {/* Last Login */}
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString("fa-IR")
                          : "ثبت‌نشده"}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pl-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isSysManager ? (
                            <>
                              <button
                                onClick={() => handleOpenRoleModal(u)}
                                title="تغییر نقش کاربری"
                                className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-purple-500/20 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors"
                              >
                                تغییر نقش
                              </button>

                              <button
                                onClick={() =>
                                  toggleStatusMutation.mutate({
                                    id: u.id,
                                    isActive: !u.is_active,
                                  })
                                }
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? "امکان تغییر وضعیت حساب خود را ندارید"
                                    : u.is_active
                                    ? "تعلیق دسترسی"
                                    : "فعال‌سازی مجدد"
                                }
                                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                  u.is_active
                                    ? "border-amber-500/20 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {u.is_active ? "تعلیق" : "فعال‌سازی"}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf}
                                title={isSelf ? "امکان حذف حساب خود را ندارید" : "حذف دائم کاربر"}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">فقط مشاهده</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-500" />
                <span>ایجاد کاربر جدید در سامانه</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="محمد حسینی"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  پست الکترونیکی (ایمیل)
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="m.hosseini@company.com"
                  dir="ltr"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  رمز عبور اولیه
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  نقش سیستمی انتخابی
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as SystemRole)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="sysmanager">مدیر ارشد سیستم (SysManager)</option>
                  <option value="admin">مدیر مالی (Admin)</option>
                  <option value="user">کاربر استاندارد (User)</option>
                  <option value="viewer">ناظر و بیننده (Viewer)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm transition-all"
                >
                  {createMutation.isPending ? "در حال ایجاد..." : "ایجاد کاربر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {isRoleModalOpen && selectedUserForRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>تغییر نقش سیستمی کاربر</span>
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUserForRole.full_name}
                </span>
                {getRoleBadge(selectedUserForRole.role)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono block" dir="ltr">
                {selectedUserForRole.email}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                نقش جدید موردنظر را انتخاب فرمایید:
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    role: "sysmanager" as SystemRole,
                    title: "مدیر ارشد سیستم (SysManager)",
                    desc: "دسترسی تام و نامحدود، مدیریت کاربران و نقش‌ها، پیکربندی",
                    color: "border-purple-500/40 text-purple-600 dark:text-purple-400",
                  },
                  {
                    role: "admin" as SystemRole,
                    title: "مدیر مالی (Admin)",
                    desc: "دسترسی مدیریت کامل حساب‌ها، دارایی‌ها، تراکنش‌ها و گزارش‌ها",
                    color: "border-sky-500/40 text-sky-600 dark:text-sky-400",
                  },
                  {
                    role: "user" as SystemRole,
                    title: "کاربر استاندارد (User)",
                    desc: "ثبت و مدیریت داده‌های مالی و حساب‌های شخصی خود",
                    color: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    role: "viewer" as SystemRole,
                    title: "ناظر و بازبین (Viewer)",
                    desc: "دسترسی فقط‌خواندنی به پورتفولیو و نمودارهای آماری",
                    color: "border-slate-500/40 text-slate-600 dark:text-slate-400",
                  },
                ].map((item) => (
                  <label
                    key={item.role}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      targetNewRole === item.role
                        ? `${item.color} bg-slate-50 dark:bg-slate-800/60 shadow-xs`
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetRole"
                      value={item.role}
                      checked={targetNewRole === item.role}
                      onChange={() => setTargetNewRole(item.role)}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold block">{item.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={updateRoleMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm transition-all"
              >
                {updateRoleMutation.isPending ? "در حال ثبت..." : "ذخیره تغییرات نقش"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
