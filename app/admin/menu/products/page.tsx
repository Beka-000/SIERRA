"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useToast } from "@/lib/ToastContext";
import ProductModal from "./ProductModal";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  weightOrVolume: string | null;
  composition: string | null;
  isAvailable: boolean;
  isRecommended: boolean;
  createdAt: string;
  category: { id: string; title: string };
  photoFile?: { url: string } | null;
  photoFileId?: string | null;
  _count: { modifiers: number };
  calories?: number | null;
  allergens?: string | null;
}

interface Category {
  id: string;
  title: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { error, success } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  
  // Модальное окно
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Удаление
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("[Categories Fetch Error]", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(availabilityFilter && { isAvailable: availabilityFilter }),
      });

      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (err) {
      console.error("[Products Fetch Error]", err);
      error("Ошибка", "Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, availabilityFilter, error]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProducts();
  }

  function handleCreateProduct() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  async function handleEditProduct(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  function handleSaveProduct() {
    fetchProducts();
  }

  async function handleDeleteProduct(productId: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Не удалось удалить товар");
      }

      success("Успешно", "Товар удалён");
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err) {
      console.error("[Delete Error]", err);
      error("Ошибка", err instanceof Error ? err.message : "Не удалось удалить товар");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Товары</h1>
          <p className="text-sm text-white/40 mt-1">{products.length} товаров</p>
        </div>
        <Button onClick={handleCreateProduct}>
          Создать товар
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "", label: "Все категории" },
              ...categories.map((c) => ({ value: c.id, label: c.title })),
            ]}
          />

          <Select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            options={[
              { value: "", label: "Все товары" },
              { value: "true", label: "Доступные" },
              { value: "false", label: "Недоступные" },
            ]}
          />
        </form>

        {(search || categoryFilter || availabilityFilter) && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setAvailabilityFilter("");
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>

      <Table
        columns={[
          {
            key: "title",
            label: "Товар",
            render: (row) => (
              <div className="flex items-center gap-3">
                {row.photoFile?.url && (
                  <img
                    src={row.photoFile.url}
                    alt={row.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{row.title}</p>
                  <p className="text-xs text-white/40">{row.category.title}</p>
                </div>
              </div>
            ),
          },
          {
            key: "price",
            label: "Цена",
            width: "100px",
            align: "right",
            render: (row) => (
              <span className="text-sm font-semibold text-[#c9a96e]">
                {row.price.toLocaleString("ru-KG")} с
              </span>
            ),
          },
          {
            key: "weightOrVolume",
            label: "Объём",
            width: "100px",
            render: (row) => (
              <span className="text-sm text-white/60">{row.weightOrVolume || "—"}</span>
            ),
          },
          {
            key: "isAvailable",
            label: "Доступность",
            width: "130px",
            render: (row) => (
              <Badge variant={row.isAvailable ? "success" : "error"}>
                {row.isAvailable ? "Доступен" : "Недоступен"}
              </Badge>
            ),
          },
          {
            key: "isRecommended",
            label: "Рекомендуем",
            width: "130px",
            render: (row) =>
              row.isRecommended ? <Badge variant="gold">Да</Badge> : <span className="text-xs text-white/30">—</span>,
          },
          {
            key: "actions",
            label: "Действия",
            width: "120px",
            align: "right",
            render: (row) => (
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProduct(row);
                  }}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition"
                  title="Редактировать"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(row.id);
                  }}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                  title="Удалить"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            ),
          },
        ]}
        data={products}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => handleEditProduct(row)}
        loading={loading}
        emptyMessage="Товары не найдены"
      />

      {/* Модальное окно создания/редактирования */}
      <ProductModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1816] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Удалить товар?</h3>
                <p className="text-sm text-white/60">
                  Вы действительно хотите удалить этот товар? Это действие может повлиять на отображение товара в меню.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1"
              >
                Отмена
              </Button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 h-11 px-6 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
