"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Textarea from "../components/ui/Textarea";
import { useToast } from "@/lib/ToastContext";
import { BRANCHES } from "@/lib/branches";

// ─── Типы ────────────────────────────────────────────────────────────────────

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

interface TableInfo {
  id: string;
  number: number;
  capacity: number;
  zone: string | null;
}

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  branchId: string | null;
  date: string;
  startTime: string;
  durationMinutes: number;
  guestsCount: number;
  comment: string | null;
  adminComment: string | null;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  table: TableInfo | null;
  user: { id: string; name: string; email: string } | null;
}

// ─── Конфигурация статусов ───────────────────────────────────────────────────

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING:    "Новая",
  CONFIRMED:  "Подтверждена",
  ARRIVED:    "Гость пришёл",
  COMPLETED:  "Завершена",
  CANCELLED:  "Отменена",
  NO_SHOW:    "Не пришёл",
};

const STATUS_VARIANTS: Record<
  ReservationStatus,
  "default" | "success" | "error" | "warning" | "info" | "gold"
> = {
  PENDING:   "info",
  CONFIRMED: "gold",
  ARRIVED:   "success",
  COMPLETED: "default",
  CANCELLED: "error",
  NO_SHOW:   "warning",
};

// Порядок переходов статусов — что можно установить из текущего
const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ARRIVED", "CANCELLED", "NO_SHOW"],
  ARRIVED:   ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
};

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function getBranchName(branchId: string | null): string {
  if (!branchId) return "—";
  return BRANCHES.find((b) => b.id === branchId)?.name ?? branchId;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Компонент страницы ───────────────────────────────────────────────────────

export default function ReservationsPage() {
  const { success, error: showError } = useToast();

  // Список
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);

  // Фильтры
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [date,     setDate]     = useState("");
  const [branchId, setBranchId] = useState("");

  // Модальное окно деталей
  const [modalOpen,   setModalOpen]   = useState(false);
  const [selected,    setSelected]    = useState<Reservation | null>(null);
  const [saving,      setSaving]      = useState(false);

  // Поля редактирования в модалке
  const [editStatus,       setEditStatus]       = useState<ReservationStatus | "">("");
  const [editAdminComment, setEditAdminComment] = useState("");

  // Подтверждение отмены
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Доступные столики (загружаются для назначения)
  const [tables,     setTables]     = useState<TableInfo[]>([]);
  const [editTable,  setEditTable]  = useState("");

  // ── Загрузка списка ───────────────────────────────────────────────────────

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "25",
        ...(search   && { search }),
        ...(status   && { status }),
        ...(date     && { date }),
        ...(branchId && { branchId }),
      });
      const res  = await fetch(`/api/admin/reservations?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setReservations(data.reservations);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (e) {
      showError("Ошибка", "Не удалось загрузить бронирования");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, date, branchId, showError]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  // ── Загрузка столиков ─────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/admin/tables")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.tables) setTables(d.tables); })
      .catch(() => {/* столики недоступны — не критично */});
  }, []);

  // ── Открытие модалки ──────────────────────────────────────────────────────

  function openModal(r: Reservation) {
    setSelected(r);
    setEditStatus("");
    setEditAdminComment(r.adminComment ?? "");
    setEditTable(r.table?.id ?? "");
    setCancelConfirm(false);
    setModalOpen(true);
  }

  // ── Сохранение изменений ──────────────────────────────────────────────────

  async function handleSave() {
    if (!selected) return;
    if (!editStatus && editAdminComment === (selected.adminComment ?? "") && editTable === (selected.table?.id ?? "")) {
      setModalOpen(false);
      return;
    }

    // Перед отменой требуем подтверждение
    if (editStatus === "CANCELLED" && !cancelConfirm) {
      setCancelConfirm(true);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        adminComment: editAdminComment.trim() || null,
        tableId:      editTable || null,
      };
      if (editStatus) body.status = editStatus;

      const res = await fetch(`/api/admin/reservations/${selected.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка сохранения");
      }

      success("Готово", "Бронирование обновлено");
      setModalOpen(false);
      fetchReservations();
    } catch (e) {
      showError("Ошибка", e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  // ── Быстрая смена статуса прямо из строки таблицы ────────────────────────

  async function handleQuickStatus(id: string, newStatus: ReservationStatus) {
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Ошибка");
      success("Готово", `Статус: ${STATUS_LABELS[newStatus]}`);
      fetchReservations();
    } catch {
      showError("Ошибка", "Не удалось изменить статус");
    }
  }

  // ─── Рендер ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Бронирования</h1>
          <p className="text-sm text-white/40 mt-1">
            {total}{" "}
            {total % 10 === 1 && total % 100 !== 11
              ? "заявка"
              : total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20)
              ? "заявки"
              : "заявок"}
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Поиск по имени, телефону…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { value: "",          label: "Все статусы"   },
              { value: "PENDING",   label: "Новая"         },
              { value: "CONFIRMED", label: "Подтверждена"  },
              { value: "ARRIVED",   label: "Гость пришёл"  },
              { value: "COMPLETED", label: "Завершена"     },
              { value: "CANCELLED", label: "Отменена"      },
              { value: "NO_SHOW",   label: "Не пришёл"     },
            ]}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="h-11 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white px-4 text-sm outline-none focus:border-[#c9a96e]/60 transition [color-scheme:dark]"
            title="Фильтр по дате"
          />

          <Select
            value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "Все филиалы" },
              ...BRANCHES.filter((b) => b.isPublic).map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
          />
        </div>

        {(search || status || date || branchId) && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatus(""); setDate(""); setBranchId(""); setPage(1); }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-white/40 text-sm">Бронирований не найдено</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Гость", "Дата и время", "Гостей", "Филиал", "Статус", "Создана", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {reservations.map((r) => {
                  const nextStatuses = STATUS_TRANSITIONS[r.status];
                  return (
                    <tr
                      key={r.id}
                      onClick={() => openModal(r)}
                      className="hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      {/* Гость */}
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white">{r.customerName}</p>
                        <a
                          href={`tel:${r.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-[#c9a96e] hover:underline"
                        >
                          {r.customerPhone}
                        </a>
                      </td>

                      {/* Дата и время */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-white">{formatDate(r.date)}</p>
                        <p className="text-xs text-white/40">{r.startTime}</p>
                      </td>

                      {/* Гостей */}
                      <td className="px-5 py-3.5 text-white/70">
                        {r.guestsCount}
                        {r.table && (
                          <span className="ml-1.5 text-xs text-white/30">
                            (стол {r.table.number})
                          </span>
                        )}
                      </td>

                      {/* Филиал */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-white/50 line-clamp-1 max-w-[140px]">
                          {getBranchName(r.branchId)}
                        </span>
                      </td>

                      {/* Статус */}
                      <td className="px-5 py-3.5">
                        <Badge variant={STATUS_VARIANTS[r.status]}>
                          {STATUS_LABELS[r.status]}
                        </Badge>
                      </td>

                      {/* Создана */}
                      <td className="px-5 py-3.5 text-xs text-white/30 whitespace-nowrap">
                        {formatCreatedAt(r.createdAt)}
                      </td>

                      {/* Быстрые действия */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          {nextStatuses.map((ns) => (
                            <button
                              key={ns}
                              title={STATUS_LABELS[ns]}
                              onClick={() => handleQuickStatus(r.id, ns)}
                              className={`
                                h-7 px-2.5 rounded-lg text-xs font-medium transition
                                ${ns === "CANCELLED" || ns === "NO_SHOW"
                                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "bg-[#c9a96e]/10 text-[#c9a96e] hover:bg-[#c9a96e]/20"
                                }
                              `}
                            >
                              {STATUS_LABELS[ns]}
                            </button>
                          ))}
                          <button
                            title="Открыть"
                            onClick={() => openModal(r)}
                            className="h-7 w-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
              <p className="text-xs text-white/30">
                Страница {page} из {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Назад
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Модальное окно деталей ─────────────────────────────────────────── */}

      {selected && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Бронирование"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                Закрыть
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Сохранить
              </Button>
            </>
          }
        >
          {cancelConfirm ? (
            /* Подтверждение отмены */
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Отменить бронирование?</p>
              <p className="text-sm text-white/50 mb-6">
                Это действие изменит статус на «Отменена» и не подлежит автоматической отмене.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={() => setCancelConfirm(false)}>
                  Назад
                </Button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 px-5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition"
                >
                  {saving ? "Отмена…" : "Да, отменить"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Информация о госте */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Гость</p>
                  <p className="text-white font-medium">{selected.customerName}</p>
                  {selected.user && (
                    <p className="text-xs text-white/30 mt-0.5">{selected.user.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Телефон</p>
                  <a
                    href={`tel:${selected.customerPhone}`}
                    className="text-[#c9a96e] font-medium hover:underline"
                  >
                    {selected.customerPhone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Дата</p>
                  <p className="text-white">{formatDate(selected.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Время</p>
                  <p className="text-white">{selected.startTime} ({selected.durationMinutes} мин)</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Гостей</p>
                  <p className="text-white">{selected.guestsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Филиал</p>
                  <p className="text-white text-sm">{getBranchName(selected.branchId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Текущий статус</p>
                  <Badge variant={STATUS_VARIANTS[selected.status]}>
                    {STATUS_LABELS[selected.status]}
                  </Badge>
                </div>
                {selected.comment && (
                  <div className="col-span-2">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Комментарий гостя</p>
                    <p className="text-sm text-white/70 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
                      {selected.comment}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06] pt-5 space-y-4">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Действия сотрудника
                </p>

                {/* Смена статуса */}
                {STATUS_TRANSITIONS[selected.status].length > 0 && (
                  <Select
                    label="Изменить статус"
                    value={editStatus}
                    onChange={(e) => {
                      setEditStatus(e.target.value as ReservationStatus | "");
                      setCancelConfirm(false);
                    }}
                    options={[
                      { value: "", label: "— не менять —" },
                      ...STATUS_TRANSITIONS[selected.status].map((s) => ({
                        value: s,
                        label: STATUS_LABELS[s],
                      })),
                    ]}
                  />
                )}

                {/* Назначение столика */}
                {tables.length > 0 && (
                  <Select
                    label="Назначить столик"
                    value={editTable}
                    onChange={(e) => setEditTable(e.target.value)}
                    options={[
                      { value: "", label: "— не назначен —" },
                      ...tables.map((tb) => ({
                        value: tb.id,
                        label: `Стол ${tb.number}${tb.zone ? ` (${tb.zone})` : ""} — до ${tb.capacity} чел.`,
                      })),
                    ]}
                  />
                )}

                {/* Внутренний комментарий */}
                <Textarea
                  label="Внутренний комментарий"
                  value={editAdminComment}
                  onChange={(e) => setEditAdminComment(e.target.value)}
                  placeholder="Заметки для сотрудников (клиент не видит)"
                  rows={3}
                />
              </div>

              {/* Мета */}
              <div className="text-xs text-white/25 border-t border-white/[0.04] pt-3 flex flex-wrap gap-x-4 gap-y-1">
                <span>ID: {selected.id.slice(0, 8)}…</span>
                <span>Создана: {formatCreatedAt(selected.createdAt)}</span>
                <span>Обновлена: {formatCreatedAt(selected.updatedAt)}</span>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
