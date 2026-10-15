"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/app/admin/components/ui/Badge";
import {
  ROLE_META,
  getAssignableRoles,
  getRoleBadgeVariant,
  type RoleMeta,
} from "@/lib/permissions";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface UserRole { id: string; code: string; title: string; }

interface UserDetail {
  id:              string;
  name:            string;
  email:           string | null;
  phone:           string | null;
  avatar:          string | null;
  googleAvatar:    string | null;
  role:            UserRole;
  isBlocked:       boolean;
  blockedReason:   string | null;
  blockedAt:       string | null;
  blockedBy:       string | null;
  blockedByUser:   { id: string; name: string; email: string } | null;
  lastSeenAt:      string | null;
  onlineStatus:    string;
  lastSeenText:    string;
  createdAt:       string;
  statistics: {
    ordersCount:            number;
    completedOrdersCount:   number;
    cancelledOrdersCount:   number;
    totalSpent:             number;
    averageOrderValue:      number;
    reviewsCount:           number;
    loyaltyBalance:         number;
  };
}

interface AllRole { id: string; code: string; title: string; }

// ─── Компонент информационного поля ──────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-white/40 flex-shrink-0 w-40">{label}</span>
      <span className="text-sm text-white text-right">{children}</span>
    </div>
  );
}

// ─── Статкарточка ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
      <p className="text-xl font-bold text-[#c9a96e]">{value}</p>
      <p className="text-xs text-white/60 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Секция смены роли ────────────────────────────────────────────────────────

function RoleChangeSection({
  user,
  allRoles,
  currentAdminRole,
  onRoleChanged,
}: {
  user:              UserDetail;
  allRoles:          AllRole[];
  currentAdminRole:  string;
  onRoleChanged:     (newRole: UserRole) => void;
}) {
  const canAssign = currentAdminRole === "admin";
  const assignableRoles = getAssignableRoles();

  const [selectedCode, setSelectedCode]   = useState(user.role.code);
  const [saving,       setSaving]         = useState(false);
  const [error,        setError]          = useState("");
  const [success,      setSuccess]        = useState("");
  const [showConfirm,  setShowConfirm]    = useState(false);

  // Описание выбранной роли
  const selectedMeta: RoleMeta | undefined = ROLE_META[selectedCode as keyof typeof ROLE_META];
  const hasChanged = selectedCode !== user.role.code;

  const handleSave = async () => {
    if (!hasChanged) return;
    // Подтверждение при назначении admin
    if (selectedCode === "admin" && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "change_role", newRoleCode: selectedCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Ошибка сохранения");
        return;
      }

      setSuccess(data.message);
      onRoleChanged(data.user.role);
      // Убираем сообщение через 4 сек
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  };

  if (!canAssign) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-1">Текущая роль</p>
        <div className="flex items-center gap-3 mt-3">
          <Badge variant={getRoleBadgeVariant(user.role.code)}>
            {ROLE_META[user.role.code as keyof typeof ROLE_META]?.titleRu ?? user.role.title}
          </Badge>
          <span className="text-xs text-white/40">
            Изменение ролей доступно только администраторам
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-white">Изменить роль</p>

      {/* Выпадающий список */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">Роль пользователя</label>
        <select
          value={selectedCode}
          onChange={(e) => { setSelectedCode(e.target.value); setError(""); setSuccess(""); setShowConfirm(false); }}
          disabled={saving}
          className="w-full h-10 px-3 rounded-lg bg-[#1a1410] border border-white/[0.1] text-white text-sm
                     focus:outline-none focus:border-[#c9a96e]/40 transition disabled:opacity-50
                     [color-scheme:dark]"
        >
          {assignableRoles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.titleRu}
            </option>
          ))}
        </select>
      </div>

      {/* Описание выбранной роли */}
      {selectedMeta && (
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-white/50 leading-relaxed">
          <span className="text-white/70 font-medium">{selectedMeta.titleRu}:</span>{" "}
          {selectedMeta.description}
        </div>
      )}

      {/* Предупреждение при назначении admin */}
      {showConfirm && selectedCode === "admin" && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          ⚠️ Вы назначаете пользователю роль <b>Администратора</b> с полным доступом к системе.
          Нажмите «Сохранить» ещё раз для подтверждения.
        </div>
      )}

      {/* Ошибка / успех */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          ✓ {success}
        </div>
      )}

      {/* Кнопка */}
      <button
        onClick={handleSave}
        disabled={!hasChanged || saving}
        className="w-full h-9 rounded-lg bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold
                   hover:bg-[#d4b87a] transition active:scale-[0.98]
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
              <path d="M21 12a9 9 0 00-9-9"/>
            </svg>
            Сохранение...
          </span>
        ) : showConfirm ? "Подтвердить назначение администратора" : "Сохранить изменения"}
      </button>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const userId   = params.id as string;

  const [user,            setUser]            = useState<UserDetail | null>(null);
  const [allRoles,        setAllRoles]        = useState<AllRole[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [currentAdminRole, setCurrentAdminRole] = useState<string>("");
  const [blockLoading,    setBlockLoading]    = useState(false);
  const [blockReason,     setBlockReason]     = useState("");
  const [showBlockForm,   setShowBlockForm]   = useState(false);
  const [actionMsg,       setActionMsg]       = useState("");
  const [actionErr,       setActionErr]       = useState("");

  // Загрузка сессии текущего администратора
  useEffect(() => {
    fetch("/api/admin/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.user?.role) setCurrentAdminRole(d.user.role); })
      .catch(() => {});
  }, []);

  // Загрузка пользователя
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Ошибка загрузки пользователя");
        return;
      }
      setUser(data.user);
      setAllRoles(data.allRoles ?? []);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleRoleChanged = (newRole: UserRole) => {
    setUser((prev) => prev ? { ...prev, role: newRole } : prev);
  };

  const handleBlock = async () => {
    if (!user || !blockReason.trim()) return;
    setBlockLoading(true);
    setActionErr("");
    setActionMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id, action: "block", reason: blockReason }),
      });
      const data = await res.json();
      if (!res.ok) { setActionErr(data.message || "Ошибка"); return; }
      setActionMsg("Пользователь заблокирован");
      setShowBlockForm(false);
      setBlockReason("");
      fetchUser();
      setTimeout(() => setActionMsg(""), 4000);
    } catch { setActionErr("Сетевая ошибка"); }
    finally   { setBlockLoading(false); }
  };

  const handleUnblock = async () => {
    if (!user || !confirm(`Разблокировать ${user.name}?`)) return;
    setBlockLoading(true);
    setActionErr("");
    setActionMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id, action: "unblock" }),
      });
      const data = await res.json();
      if (!res.ok) { setActionErr(data.message || "Ошибка"); return; }
      setActionMsg("Пользователь разблокирован");
      fetchUser();
      setTimeout(() => setActionMsg(""), 4000);
    } catch { setActionErr("Сетевая ошибка"); }
    finally   { setBlockLoading(false); }
  };

  // ── Состояния загрузки и ошибки ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin text-[#c9a96e] w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
          <path d="M21 12a9 9 0 00-9-9"/>
        </svg>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <p className="text-red-400 mb-6">{error || "Пользователь не найден"}</p>
        <button onClick={() => router.back()} className="text-[#c9a96e] hover:underline text-sm">
          ← Назад к списку
        </button>
      </div>
    );
  }

  const roleMeta = ROLE_META[user.role.code as keyof typeof ROLE_META];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Шапка */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Клиенты
        </button>
        <span className="text-white/20">/</span>
        <span className="text-sm text-white/60 truncate">{user.name}</span>
      </div>

      {/* Уведомления */}
      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          ✓ {actionMsg}
        </div>
      )}
      {actionErr && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {actionErr}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Левая колонка: профиль + роль ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Карточка профиля */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center">
            {/* Аватар */}
            <div className="relative inline-block mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#c9a96e]/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#c9a96e]/15 border-2 border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {user.onlineStatus === "online" && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0f0d0b] rounded-full" />
              )}
            </div>

            <h1 className="text-lg font-semibold text-white mb-1">{user.name}</h1>
            <p className="text-sm text-white/40 mb-3 break-all">
              {user.email || user.phone || "—"}
            </p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant={getRoleBadgeVariant(user.role.code)}>
                {roleMeta?.titleRu ?? user.role.title}
              </Badge>
              {user.isBlocked && <Badge variant="error">Заблокирован</Badge>}
              {!user.isBlocked && <Badge variant="success">Активен</Badge>}
            </div>

            {/* Онлайн */}
            <p className={`mt-3 text-xs ${user.onlineStatus === "online" ? "text-emerald-400" : "text-white/30"}`}>
              {user.lastSeenText}
            </p>
          </div>

          {/* Смена роли */}
          <RoleChangeSection
            user={user}
            allRoles={allRoles}
            currentAdminRole={currentAdminRole}
            onRoleChanged={handleRoleChanged}
          />

          {/* Блокировка */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-white">Управление доступом</p>

            {user.isBlocked ? (
              <>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 space-y-1">
                  <p><b>Заблокирован</b></p>
                  {user.blockedReason && <p>Причина: {user.blockedReason}</p>}
                  {user.blockedAt && (
                    <p>Дата: {new Date(user.blockedAt).toLocaleString("ru-RU")}</p>
                  )}
                  {user.blockedByUser && <p>Кем: {user.blockedByUser.name}</p>}
                </div>
                <button
                  onClick={handleUnblock}
                  disabled={blockLoading}
                  className="w-full h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition disabled:opacity-50"
                >
                  Разблокировать
                </button>
              </>
            ) : (
              <>
                {!showBlockForm ? (
                  <button
                    onClick={() => setShowBlockForm(true)}
                    className="w-full h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition"
                  >
                    Заблокировать
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Причина блокировки..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a1410] border border-white/[0.1] text-white text-sm
                                 placeholder:text-white/30 focus:outline-none focus:border-red-500/40 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowBlockForm(false); setBlockReason(""); }}
                        className="flex-1 h-8 rounded-lg border border-white/[0.1] text-white/50 text-xs hover:bg-white/[0.04] transition"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleBlock}
                        disabled={blockLoading || !blockReason.trim()}
                        className="flex-1 h-8 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/25 transition disabled:opacity-50"
                      >
                        {blockLoading ? "..." : "Заблокировать"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Правая колонка: детали ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Статистика */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Заказов всего"
              value={user.statistics.ordersCount}
            />
            <StatCard
              label="Выполнено"
              value={user.statistics.completedOrdersCount}
            />
            <StatCard
              label="Потрачено"
              value={`${user.statistics.totalSpent.toLocaleString()} с`}
            />
            <StatCard
              label="Бонусы"
              value={user.statistics.loyaltyBalance}
              sub="баллов"
            />
          </div>

          {/* Основная информация */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Основная информация</h2>
            <div>
              <InfoRow label="Имя">{user.name}</InfoRow>
              <InfoRow label="Email">{user.email || <span className="text-white/30">—</span>}</InfoRow>
              <InfoRow label="Телефон">{user.phone || <span className="text-white/30">—</span>}</InfoRow>
              <InfoRow label="Роль">
                <Badge variant={getRoleBadgeVariant(user.role.code)}>
                  {roleMeta?.titleRu ?? user.role.title}
                </Badge>
              </InfoRow>
              <InfoRow label="Статус аккаунта">
                {user.isBlocked
                  ? <Badge variant="error">Заблокирован</Badge>
                  : <Badge variant="success">Активен</Badge>}
              </InfoRow>
              <InfoRow label="Дата регистрации">
                {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </InfoRow>
              <InfoRow label="Последняя активность">
                <span className={user.onlineStatus === "online" ? "text-emerald-400" : ""}>
                  {user.lastSeenText}
                </span>
              </InfoRow>
              <InfoRow label="Вход через Google">
                {user.googleAvatar ? (
                  <Badge variant="info">Google</Badge>
                ) : <span className="text-white/30">—</span>}
              </InfoRow>
            </div>
          </div>

          {/* Информация о роли */}
          {roleMeta && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-3">О роли «{roleMeta.titleRu}»</h2>
              <p className="text-sm text-white/50 leading-relaxed">{roleMeta.description}</p>
              <p className="mt-2 text-xs text-white/30">
                {roleMeta.isAdminRole
                  ? "✓ Имеет доступ к административной панели"
                  : "✗ Нет доступа к административной панели"}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
