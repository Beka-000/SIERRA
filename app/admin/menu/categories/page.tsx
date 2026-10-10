"use client";

import { useEffect, useState } from "react";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { useToast } from "@/lib/ToastContext";

interface Category {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
}

export default function CategoriesPage() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ title: "", sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("[Categories Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setFormData({ title: "", sortOrder: categories.length, isActive: true });
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormData({
      title: category.title,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      error("Ошибка", "Название обязательно");
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        success("Успешно", editingCategory ? "Категория обновлена" : "Категория создана");
        setModalOpen(false);
        await fetchCategories();
      } else {
        const data = await res.json();
        error("Ошибка", data.message || "Не удалось сохранить категорию");
      }
    } catch (err) {
      console.error("[Save Error]", err);
      error("Ошибка", "Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (category._count.products > 0) {
      error("Ошибка", "Невозможно удалить категорию с товарами");
      return;
    }

    if (!confirm(`Удалить категорию "${category.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        success("Успешно", "Категория удалена");
        await fetchCategories();
      } else {
        error("Ошибка", "Не удалось удалить категорию");
      }
    } catch (err) {
      console.error("[Delete Error]", err);
      error("Ошибка", "Не удалось удалить категорию");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Категории меню</h1>
          <p className="text-sm text-white/40 mt-1">{categories.length} категорий</p>
        </div>
        <Button onClick={openCreateModal}>Создать категорию</Button>
      </div>

      <Table
        columns={[
          {
            key: "title",
            label: "Название",
            render: (row) => (
              <div>
                <p className="text-sm font-medium text-white">{row.title}</p>
                <p className="text-xs text-white/40">{row._count.products} товаров</p>
              </div>
            ),
          },
          {
            key: "sortOrder",
            label: "Порядок",
            width: "100px",
            render: (row) => <span className="text-sm text-white/60">{row.sortOrder}</span>,
          },
          {
            key: "isActive",
            label: "Статус",
            width: "120px",
            render: (row) => (
              <Badge variant={row.isActive ? "success" : "default"}>
                {row.isActive ? "Активна" : "Неактивна"}
              </Badge>
            ),
          },
          {
            key: "createdAt",
            label: "Создана",
            width: "140px",
            render: (row) => (
              <span className="text-xs text-white/40">
                {new Date(row.createdAt).toLocaleDateString("ru-KG")}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Действия",
            width: "160px",
            align: "right",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
                  Изменить
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(row)}
                  disabled={row._count.products > 0}
                >
                  Удалить
                </Button>
              </div>
            ),
          },
        ]}
        data={categories}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="Категории не найдены"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Редактировать категорию" : "Создать категорию"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingCategory ? "Сохранить" : "Создать"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Например: Кофе"
          />
          <Input
            label="Порядок сортировки"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-white/[0.06] text-[#c9a96e] focus:ring-[#c9a96e]/20"
            />
            Активна
          </label>
        </div>
      </Modal>
    </div>
  );
}
