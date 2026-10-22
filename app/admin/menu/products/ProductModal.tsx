"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { useToast } from "@/lib/ToastContext";

interface Category {
  id: string;
  title: string;
}

interface Product {
  id?: string;
  title: string;
  categoryId: string;
  price: number;
  weightOrVolume?: string;
  composition?: string;
  description?: string;
  photoFileId?: string;
  photoFile?: { url: string };
  isAvailable: boolean;
  isRecommended: boolean;
  calories?: number;
  allergens?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product?: Product | null;
  categories: Category[];
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}: ProductModalProps) {
  const { success, error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    price: "",
    weightOrVolume: "",
    composition: "",
    description: "",
    isAvailable: true,
    isRecommended: false,
    calories: "",
    allergens: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Инициализация формы при открытии
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Режим редактирования
        setFormData({
          title: product.title || "",
          categoryId: product.categoryId || "",
          price: product.price?.toString() || "",
          weightOrVolume: product.weightOrVolume || "",
          composition: product.composition || "",
          description: product.description || "",
          isAvailable: product.isAvailable ?? true,
          isRecommended: product.isRecommended ?? false,
          calories: product.calories?.toString() || "",
          allergens: product.allergens || "",
        });
        setUploadedFileId(product.photoFileId || null);
        setImagePreview(product.photoFile?.url || null);
      } else {
        // Режим создания
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, product]);

  function resetForm() {
    setFormData({
      title: "",
      categoryId: "",
      price: "",
      weightOrVolume: "",
      composition: "",
      description: "",
      isAvailable: true,
      isRecommended: false,
      calories: "",
      allergens: "",
    });
    setImagePreview(null);
    setUploadedFileId(null);
    setErrors({});
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Название обязательно";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Выберите категорию";
    }

    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = "Введите корректную цену";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showError("Ошибка", "Разрешены только JPG, PNG и WebP изображения");
      return;
    }

    // Keep the multipart request below Vercel Functions' 4.5 MB payload limit.
    if (file.size > 4 * 1024 * 1024) {
      showError("Ошибка", "Размер файла не должен превышать 4 МБ");
      return;
    }

    // Показываем предпросмотр
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем файл
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка загрузки");
      }

      const data = await res.json();
      setUploadedFileId(data.id);
      success("Успешно", "Изображение загружено");
    } catch (err) {
      console.error("[Image Upload Error]", err);
      showError("Ошибка", err instanceof Error ? err.message : "Не удалось загрузить изображение");
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setUploadedFileId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        weightOrVolume: formData.weightOrVolume.trim() || null,
        composition: formData.composition.trim() || null,
        description: formData.description.trim() || null,
        photoFileId: uploadedFileId || null,
        isAvailable: formData.isAvailable,
        isRecommended: formData.isRecommended,
        calories: formData.calories ? parseInt(formData.calories) : null,
        allergens: formData.allergens.trim() || null,
      };

      let res;
      if (product?.id) {
        // Обновление
        res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Создание
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка сохранения");
      }

      success("Успешно", product?.id ? "Товар обновлён" : "Товар создан");
      onSave();
      onClose();
    } catch (err) {
      console.error("[Product Save Error]", err);
      showError("Ошибка", err instanceof Error ? err.message : "Не удалось сохранить товар");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product?.id ? "Редактировать товар" : "Создать товар"}>
      <div className="space-y-5">
        {/* Название */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            Название товара *
          </label>
          <Input
            placeholder="Например, Капучино"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />
        </div>

        {/* Цена и Объём/вес */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Цена (сом) *
            </label>
            <Input
              type="number"
              placeholder="180"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              error={errors.price}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Объём / вес
            </label>
            <Input
              placeholder="250 мл"
              value={formData.weightOrVolume}
              onChange={(e) => setFormData({ ...formData, weightOrVolume: e.target.value })}
            />
          </div>
        </div>

        {/* Категория */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            Категория *
          </label>
          <Select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={[
              { value: "", label: "Выберите категорию" },
              ...categories.map((c) => ({ value: c.id, label: c.title })),
            ]}
            error={errors.categoryId}
          />
        </div>

        {/* Фотография */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            Фотография товара
          </label>
          <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-6 text-center hover:border-[#c9a96e]/30 transition">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-cover"
                  onError={(e) => {
                    // Старый URL недоступен (напр. Vercel Blob) — очищаем превью
                    e.currentTarget.style.display = "none";
                    setImagePreview(null);
                    setUploadedFileId(null);
                  }}
                />
                <div className="mt-4 flex gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    Заменить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#c9a96e]/10 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <p className="text-sm text-white/60 mb-2">Загрузить фотографию</p>
                <p className="text-xs text-white/30">JPG, PNG или WebP</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="mt-3"
                >
                  {uploadingImage ? "Загрузка..." : "Выбрать файл"}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Состав */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            Состав
          </label>
          <Textarea
            placeholder="Эспрессо, молоко..."
            value={formData.composition}
            onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
            rows={2}
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            Описание
          </label>
          <Textarea
            placeholder="Описание товара..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        {/* Калорийность и Аллергены */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Калорийность (ккал)
            </label>
            <Input
              type="number"
              placeholder="150"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Аллергены
            </label>
            <Input
              placeholder="Молоко, орехи"
              value={formData.allergens}
              onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
            />
          </div>
        </div>

        {/* Переключатели */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition">
            <span className="text-sm text-white/80">В наличии</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/[0.1] rounded-full peer peer-checked:bg-[#c9a96e] transition"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition"></div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition">
            <span className="text-sm text-white/80">Рекомендуемый товар</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.isRecommended}
                onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/[0.1] rounded-full peer peer-checked:bg-[#c9a96e] transition"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition"></div>
            </div>
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || uploadingImage}
            className="flex-1"
          >
            {loading ? "Сохранение..." : product?.id ? "Сохранить изменения" : "Создать товар"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={loading} className="flex-1">
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
