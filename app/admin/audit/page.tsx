"use client";

import { useEffect, useState, useCallback } from "react";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(entityType && { entityType }),
      });

      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("[Audit Fetch Error]", error);
    } finally {
      setLoading(false);
    }
  }, [page, entityType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionLabels: Record<string, string> = {
    create: "Создание",
    update: "Изменение",
    delete: "Удаление",
    status_change: "Смена статуса",
    login: "Вход",
    logout: "Выход",
  };

  const actionVariants: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
    create: "success",
    update: "warning",
    delete: "error",
    status_change: "info",
    login: "info",
    logout: "default",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Журнал действий</h1>
        <p className="text-sm text-white/40 mt-1">История всех действий в системе</p>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Все типы" },
              { value: "order", label: "Заказы" },
              { value: "product", label: "Товары" },
              { value: "category", label: "Категории" },
              { value: "user", label: "Пользователи" },
              { value: "promocode", label: "Промокоды" },
              { value: "review", label: "Отзывы" },
            ]}
          />
        </div>
      </div>

      <Table
        columns={[
          {
            key: "createdAt",
            label: "Дата и время",
            width: "180px",
            render: (row) => (
              <span className="text-xs text-white/60">
                {new Date(row.createdAt).toLocaleString("ru-KG")}
              </span>
            ),
          },
          {
            key: "user",
            label: "Пользователь",
            render: (row) => (
              <div>
                <p className="text-sm text-white">{row.user?.name || "Система"}</p>
                {row.user?.email && <p className="text-xs text-white/40">{row.user.email}</p>}
              </div>
            ),
          },
          {
            key: "action",
            label: "Действие",
            width: "140px",
            render: (row) => (
              <Badge variant={actionVariants[row.action] || "default"}>
                {actionLabels[row.action] || row.action}
              </Badge>
            ),
          },
          {
            key: "entityType",
            label: "Тип",
            width: "120px",
            render: (row) => <span className="text-sm text-white/60">{row.entityType}</span>,
          },
          {
            key: "entityId",
            label: "ID",
            width: "100px",
            render: (row) => (
              <span className="text-xs font-mono text-white/40">
                {row.entityId?.slice(0, 8) || "—"}
              </span>
            ),
          },
          {
            key: "details",
            label: "Детали",
            render: (row) => (
              <span className="text-xs text-white/40">
                {JSON.stringify(row.details).slice(0, 60)}...
              </span>
            ),
          },
        ]}
        data={logs}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="Записи не найдены"
      />
    </div>
  );
}
