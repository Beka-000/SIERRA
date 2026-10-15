"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Table from "../components/ui/Table";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

interface Promocode {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  status: string;
  totalDiscount: number;
  ordersCount: number;
  remainingUses: number | null;
}

export default function PromocodesPage() {
  const router = useRouter();
  const [promocodes, setPromocodes] = useState<Promocode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    usageLimit: "",
    usesPerCustomer: "",
    firstOrderOnly: false,
    validFrom: "",
    validUntil: "",
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPromocodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/promocodes?${params}`);
      const data = await res.json();

      if (res.ok) {
        setPromocodes(data.promocodes);
      }
    } catch (error) {
      console.error("Ошибка загрузки промокодов:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromocodes();
  }, [search, statusFilter]);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const handleCreatePromocode = async () => {
    setFormError(null);

    // Клиентская валидация перед отправкой
    if (!formData.code.trim()) {
      setFormError("Введите код промокода");
      return;
    }
    const dv = parseFloat(formData.discountValue);
    if (!formData.discountValue || isNaN(dv) || dv <= 0) {
      setFormError("Введите корректный размер скидки");
      return;
    }
    if (formData.discountType === "percent" && dv > 100) {
      setFormError("Процентная скидка не может превышать 100%");
      return;
    }
    if (!formData.validFrom || !formData.validUntil) {
      setFormError("Укажите даты начала и окончания");
      return;
    }

    // Парсим datetime-local ("2026-10-12T14:30") в ISO с секундами
    const parseDate = (val: string): string => {
      // datetime-local даёт "YYYY-MM-DDTHH:mm" без секунд — добавляем ":00"
      const normalized = val.length === 16 ? val + ":00" : val;
      return new Date(normalized).toISOString();
    };

    try {
      setFormLoading(true);

      const payload = {
        code:             formData.code.trim().toUpperCase(),
        name:             formData.name.trim() || null,
        description:      formData.description.trim() || null,
        discountType:     formData.discountType,
        discountValue:    parseFloat(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        minOrderAmount:   formData.minOrderAmount    ? parseFloat(formData.minOrderAmount)    : null,
        usageLimit:       formData.usageLimit        ? parseInt(formData.usageLimit)          : null,
        usesPerCustomer:  formData.usesPerCustomer   ? parseInt(formData.usesPerCustomer)     : null,
        firstOrderOnly:   formData.firstOrderOnly,
        validFrom:        parseDate(formData.validFrom),
        validUntil:       parseDate(formData.validUntil),
        isActive:         formData.isActive,
      };

      console.log("[Promocodes] Отправляем payload:", payload);

      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("[Promocodes] Ответ сервера:", res.status, data);

      if (res.ok) {
        setCreateModalOpen(false);
        resetForm();
        fetchPromocodes();
      } else {
        const msg = data.message || data.error || `Ошибка сервера ${res.status}`;
        console.error("[Promocodes] Ошибка создания:", res.status, data);
        setFormError(msg);
      }
    } catch (error) {
      console.error("[Promocodes] Network error:", error);
      setFormError(error instanceof Error ? error.message : "Сетевая ошибка");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormError(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      discountType: "percent",
      discountValue: "",
      maxDiscountAmount: "",
      minOrderAmount: "",
      usageLimit: "",
      usesPerCustomer: "",
      firstOrderOnly: false,
      validFrom: "",
      validUntil: "",
      isActive: true,
    });
  };

  const handleToggleActive = async (promocode: Promocode) => {
    try {
      const res = await fetch(`/api/admin/promocodes/${promocode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promocode.isActive }),
      });

      if (res.ok) {
        fetchPromocodes();
      } else {
        const data = await res.json();
        alert(data.message || "Ошибка изменения статуса");
      }
    } catch (error) {
      console.error("Ошибка изменения статуса:", error);
    }
  };

  const getStatusBadge = (promocode: Promocode) => {
    switch (promocode.status) {
      case "active":
        return <Badge variant="success">Активен</Badge>;
      case "scheduled":
        return <Badge variant="default">Запланирован</Badge>;
      case "expired":
        return <Badge variant="error">Истёк</Badge>;
      case "depleted":
        return <Badge variant="warning">Исчерпан</Badge>;
      case "inactive":
        return <Badge variant="default">Неактивен</Badge>;
      default:
        return <Badge variant="default">{promocode.status}</Badge>;
    }
  };

  const columns = [
    {
      key: "code",
      label: "Код",
      render: (p: Promocode) => (
        <div>
          <div className="font-mono font-semibold text-white">{p.code}</div>
          {p.name && <div className="text-xs text-white/60">{p.name}</div>}
        </div>
      ),
    },
    {
      key: "discount",
      label: "Скидка",
      render: (p: Promocode) => (
        <div className="text-white">
          {p.discountType === "percent" ? `${p.discountValue}%` : `${p.discountValue} с`}
          {p.maxDiscountAmount && (
            <div className="text-xs text-white/60">макс. {p.maxDiscountAmount} с</div>
          )}
        </div>
      ),
    },
    {
      key: "usage",
      label: "Использование",
      render: (p: Promocode) => (
        <div className="text-sm">
          <div className="text-white">
            {p.usedCount} {p.usageLimit ? `/ ${p.usageLimit}` : ""}
          </div>
          {p.remainingUses !== null && (
            <div className="text-xs text-white/60">осталось: {p.remainingUses}</div>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      label: "Срок действия",
      render: (p: Promocode) => (
        <div className="text-xs text-white/60">
          <div>{new Date(p.validFrom).toLocaleDateString("ru-RU")}</div>
          <div>→ {new Date(p.validUntil).toLocaleDateString("ru-RU")}</div>
        </div>
      ),
    },
    {
      key: "stats",
      label: "Статистика",
      render: (p: Promocode) => (
        <div className="text-sm">
          <div className="text-white">{p.ordersCount} заказов</div>
          <div className="text-xs text-white/60">скидка: {p.totalDiscount.toLocaleString()} с</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Статус",
      render: (p: Promocode) => getStatusBadge(p),
    },
    {
      key: "actions",
      label: "Действия",
      render: (p: Promocode) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/promocodes/${p.id}`);
            }}
            className="text-[#c9a96e] hover:text-[#d4b882] text-sm transition"
          >
            Открыть
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(p);
            }}
            className={`text-sm transition ${
              p.isActive ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"
            }`}
          >
            {p.isActive ? "Деактивировать" : "Активировать"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Промокоды</h1>
          <p className="text-white/60">Управление скидочными промокодами</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>Создать промокод</Button>
      </div>

      {/* Фильтры */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Поиск по коду или названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="scheduled">Запланированные</option>
            <option value="expired">Истёкшие</option>
            <option value="depleted">Исчерпанные</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={promocodes}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => router.push(`/admin/promocodes/${p.id}`)}
        loading={loading}
        emptyMessage="Промокоды не найдены"
      />

      {/* Модальное окно создания */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title="Создать промокод"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Блок ошибки */}
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              ⚠️ {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Код промокода *
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2024"
                  maxLength={20}
                />
                <Button variant="outline" onClick={generateCode}>
                  Сгенерировать
                </Button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Летняя акция"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Описание</label>
              <textarea
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition resize-none"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание акции"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Тип скидки *
              </label>
              <Select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as "percent" | "fixed" })
                }
              >
                <option value="percent">Процентная</option>
                <option value="fixed">Фиксированная</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Размер скидки *
              </label>
              <Input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === "percent" ? "10" : "500"}
                min="0"
                max={formData.discountType === "percent" ? "100" : undefined}
              />
            </div>

            {formData.discountType === "percent" && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Максимальная скидка, с
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  placeholder="1000"
                  min="0"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Мин. сумма заказа, с
              </label>
              <Input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Общий лимит использований
              </label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="100"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Дата начала *
              </label>
              <Input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Дата окончания *
              </label>
              <Input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="firstOrderOnly"
                checked={formData.firstOrderOnly}
                onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="firstOrderOnly" className="text-sm text-white/80">
                Только для первого заказа
              </label>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm text-white/80">
                Активен
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              disabled={formLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreatePromocode}
              disabled={formLoading}
            >
              {formLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0f0d0b]/30 border-t-[#0f0d0b] rounded-full animate-spin inline-block" />
                  Создание...
                </span>
              ) : "Создать"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
