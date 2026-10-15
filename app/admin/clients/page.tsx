"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Table from "../components/ui/Table";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { ROLE_META, getRoleBadgeVariant } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: {
    code: string;
    title: string;
  };
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  blockedBy: {
    name: string;
  } | null;
  lastSeenAt: string | null;
  onlineStatus: string;
  lastSeenText: string;
  ordersCount: number;
  completedOrdersCount: number;
  totalSpent: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });

      if (search) params.set("search", search);
      if (roleFilter) params.set("roleCode", roleFilter);
      if (statusFilter) params.set("isBlocked", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error("Ошибка загрузки пользователей:", data.message);
      }
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter, statusFilter]);

  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "block",
          reason: blockReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBlockModalOpen(false);
        setBlockReason("");
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.message || "Ошибка блокировки");
      }
    } catch (error) {
      console.error("Ошибка блокировки:", error);
      alert("Ошибка блокировки пользователя");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (user: User) => {
    if (!confirm(`Разблокировать пользователя ${user.name}?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "unblock",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.message || "Ошибка разблокировки");
      }
    } catch (error) {
      console.error("Ошибка разблокировки:", error);
      alert("Ошибка разблокировки пользователя");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Пользователь",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {user.onlineStatus === "online" && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f0d0b] rounded-full" />
            )}
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-white/40">{user.email || user.phone || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Роль",
      render: (user: User) => (
        <Badge variant={getRoleBadgeVariant(user.role.code)}>
          {ROLE_META[user.role.code as keyof typeof ROLE_META]?.titleRu ?? user.role.title}
        </Badge>
      ),
    },
    {
      key: "lastSeenText",
      label: "Последняя активность",
      render: (user: User) => (
        <div className="text-sm">
          <div className={user.onlineStatus === "online" ? "text-green-400" : "text-white/60"}>
            {user.lastSeenText}
          </div>
        </div>
      ),
    },
    {
      key: "orders",
      label: "Заказы",
      render: (user: User) => (
        <div className="text-sm">
          <div className="text-white">{user.completedOrdersCount} выполнено</div>
          <div className="text-white/40 text-xs">из {user.ordersCount} всего</div>
        </div>
      ),
    },
    {
      key: "totalSpent",
      label: "Потрачено",
      render: (user: User) => <div className="font-medium">{user.totalSpent.toLocaleString()} с</div>,
    },
    {
      key: "status",
      label: "Статус",
      render: (user: User) => (
        <div>
          {user.isBlocked ? (
            <Badge variant="error">Заблокирован</Badge>
          ) : (
            <Badge variant="success">Активен</Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Действия",
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/clients/${user.id}`);
            }}
            className="text-[#c9a96e] hover:text-[#d4b882] text-sm transition"
          >
            Открыть
          </button>
          {user.isBlocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnblockUser(user);
              }}
              className="text-green-400 hover:text-green-300 text-sm transition"
            >
              Разблокировать
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(user);
                setBlockModalOpen(true);
              }}
              className="text-red-400 hover:text-red-300 text-sm transition"
            >
              Заблокировать
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Клиенты</h1>
        <p className="text-white/60">Управление зарегистрированными пользователями</p>
      </div>

      {/* Фильтры */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Поиск по имени, email, телефону..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          />
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">Все роли</option>
            <option value="admin">Администратор</option>
            <option value="manager">Менеджер</option>
            <option value="cashier">Кассир</option>
            <option value="kitchen">Сотрудник кухни</option>
            <option value="content_manager">Контент-менеджер</option>
            <option value="staff">Сотрудник</option>
            <option value="client">Клиент</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">Все статусы</option>
            <option value="false">Активные</option>
            <option value="true">Заблокированные</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setStatusFilter("");
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      </div>

      {/* Таблица */}
      <Table
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        onRowClick={(user) => router.push(`/admin/clients/${user.id}`)}
        loading={loading}
        emptyMessage="Пользователи не найдены"
      />

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            Показано {users.length} из {pagination.total} пользователей
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Назад
            </Button>
            <div className="flex items-center gap-2 px-4 text-white">
              Страница {pagination.page} из {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}

      {/* Модальное окно блокировки */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => {
          setBlockModalOpen(false);
          setBlockReason("");
          setSelectedUser(null);
        }}
        title="Блокировка пользователя"
      >
        <div className="space-y-4">
          <p className="text-white/60">
            Вы уверены, что хотите заблокировать пользователя{" "}
            <span className="text-white font-medium">{selectedUser?.name}</span>?
          </p>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Причина блокировки *
            </label>
            <textarea
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition resize-none"
              rows={3}
              placeholder="Укажите причину блокировки..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setBlockModalOpen(false);
                setBlockReason("");
                setSelectedUser(null);
              }}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleBlockUser}
              disabled={!blockReason.trim() || actionLoading}
            >
              {actionLoading ? "Блокировка..." : "Заблокировать"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
