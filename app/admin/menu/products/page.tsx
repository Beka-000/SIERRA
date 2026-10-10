"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useToast } from "@/lib/ToastContext";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  weightOrVolume: string | null;
  isAvailable: boolean;
  isRecommended: boolean;
  createdAt: string;
  category: { id: string; title: string };
  _count: { modifiers: number };
}

interface Category {
  id: string;
  title: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Товары</h1>
          <p className="text-sm text-white/40 mt-1">{products.length} товаров</p>
        </div>
        <Button onClick={() => router.push("/admin/menu/products/create")}>
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
              <div>
                <p className="text-sm font-medium text-white">{row.title}</p>
                <p className="text-xs text-white/40">{row.category.title}</p>
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
            key: "createdAt",
            label: "Создан",
            width: "120px",
            render: (row) => (
              <span className="text-xs text-white/40">
                {new Date(row.createdAt).toLocaleDateString("ru-KG")}
              </span>
            ),
          },
        ]}
        data={products}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/menu/products/${row.id}`)}
        loading={loading}
        emptyMessage="Товары не найдены"
      />
    </div>
  );
}
