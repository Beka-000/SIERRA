"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useCart } from "@/lib/CartContext";
import { usePhoneInput } from "@/lib/usePhoneInput";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import { getPickupBranches, formatPhone, type Branch } from "@/lib/branches";

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  deliveryType: "delivery" | "pickup";
  address: string;
  comment: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, totalAmount, loading: cartLoading } = useCart();
  const { locale } = useLocale();
  const i18n = t(locale);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CheckoutForm> & { pickupBranch?: string }>({});
  const phone = usePhoneInput();

  const [appliedPromocode, setAppliedPromocode] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const [form, setForm] = useState<CheckoutForm>({
    name:         "",
    phone:        "",
    email:        "",
    deliveryType: "delivery",
    address:      "",
    comment:      "",
  });

  // Выбранный филиал для самовывоза
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Список филиалов для самовывоза — только со статусом "open"
  const pickupBranches: Branch[] = getPickupBranches();
  const selectedBranch = pickupBranches.find((b) => b.id === selectedBranchId) ?? null;

  // Загрузка применённого промокода из sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("appliedPromocode");
      if (saved) setAppliedPromocode(JSON.parse(saved));
    } catch {}
  }, []);

  // Перенаправляем если корзина пуста
  useEffect(() => {
    if (!cartLoading && items.length === 0) router.push("/cart");
  }, [cartLoading, items.length, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDeliveryTypeChange = (type: "delivery" | "pickup") => {
    setForm((prev) => ({ ...prev, deliveryType: type, address: "" }));
    setErrors((prev) => ({ ...prev, address: undefined, pickupBranch: undefined }));
    // Не сбрасываем выбор филиала — пользователь мог уже выбрать
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    setErrors((prev) => ({ ...prev, pickupBranch: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.name.trim()) {
      newErrors.name = i18n.checkout.nameRequired;
    }
    if (!phone.validate()) {
      newErrors.phone = phone.errorMsg || i18n.checkout.phoneRequired;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = i18n.checkout.emailInvalid;
    }
    if (form.deliveryType === "delivery" && !form.address.trim()) {
      newErrors.address = i18n.checkout.addressRequired;
    }
    if (form.deliveryType === "pickup" && !selectedBranchId) {
      newErrors.pickupBranch =
        locale === "en" ? "Please select a pickup location" :
        locale === "ky" ? "Кофеканды тандаңыз" :
        "Выберите кофейню для самовывоза";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const orderData: Record<string, unknown> = {
        customerName:   form.name,
        customerPhone:  phone.rawValue,
        customerEmail:  form.email || undefined,
        deliveryType:   form.deliveryType,
        deliveryAddress:
          form.deliveryType === "delivery" ? form.address : undefined,
        // Передаём ID и адрес выбранного филиала для самовывоза
        pickupBranchId:
          form.deliveryType === "pickup" ? selectedBranchId : undefined,
        comment:    form.comment || undefined,
        promocode:  appliedPromocode?.code || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity:  item.quantity,
          modifiers: item.modifiers || [],
        })),
      };

      const response = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(orderData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || i18n.checkout.errorOrder);

      sessionStorage.removeItem("appliedPromocode");

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/order/${data.orderId}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Ошибка при оформлении заказа");
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-white/40">{i18n.loading}</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {i18n.checkout.title}
            </h1>
            <p className="text-[rgba(245,240,232,0.6)]">{i18n.checkout.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Форма ─────────────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Контактные данные */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    {i18n.checkout.contactsTitle}
                  </h2>
                  <div className="space-y-4">

                    {/* Имя */}
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        {i18n.checkout.nameLabel} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        placeholder={i18n.checkout.namePlaceholder}
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.name ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name}</p>}
                    </div>

                    {/* Телефон */}
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        {i18n.checkout.phoneLabel} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={phone.value}
                        onChange={(e) => {
                          phone.onChange(e);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        onBlur={phone.onBlur}
                        placeholder={i18n.checkout.phonePlaceholder}
                        maxLength={17}
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.phone || phone.errorMsg
                            ? "border-red-500/50"
                            : phone.isValid
                            ? "border-green-500/30"
                            : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {(errors.phone || phone.errorMsg) && (
                        <p className="text-sm text-red-400 mt-1">{errors.phone || phone.errorMsg}</p>
                      )}
                      {!errors.phone && phone.isValid && (
                        <p className="text-sm text-green-400 mt-1">
                          ✓{" "}
                          {locale === "ky"
                            ? "Номер туура"
                            : locale === "en"
                            ? "Number is valid"
                            : "Номер корректен"}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        {i18n.checkout.emailLabel}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        placeholder={i18n.checkout.emailPlaceholder}
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.email ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Способ получения */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    {i18n.checkout.deliveryTitle}
                  </h2>

                  {/* Переключатель доставка/самовывоз */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => handleDeliveryTypeChange("delivery")}
                      className={`p-4 rounded-xl border-2 transition text-left ${
                        form.deliveryType === "delivery"
                          ? "border-[#c9a96e] bg-[#c9a96e]/10"
                          : "border-white/[0.08] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${form.deliveryType === "delivery" ? "border-[#c9a96e]" : "border-white/30"}`}>
                          {form.deliveryType === "delivery" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#c9a96e]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#f5f0e8]">{i18n.checkout.deliveryOption}</p>
                          <p className="text-sm text-[rgba(245,240,232,0.5)]">{i18n.checkout.deliveryFree}</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeliveryTypeChange("pickup")}
                      className={`p-4 rounded-xl border-2 transition text-left ${
                        form.deliveryType === "pickup"
                          ? "border-[#c9a96e] bg-[#c9a96e]/10"
                          : "border-white/[0.08] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${form.deliveryType === "pickup" ? "border-[#c9a96e]" : "border-white/30"}`}>
                          {form.deliveryType === "pickup" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#c9a96e]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#f5f0e8]">{i18n.checkout.pickupOption}</p>
                          <p className="text-sm text-[rgba(245,240,232,0.5)]">{i18n.checkout.pickupFrom}</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Поле адреса доставки */}
                  {form.deliveryType === "delivery" && (
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        {i18n.checkout.addressLabel} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        placeholder={i18n.checkout.addressPlaceholder}
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.address ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.address && <p className="text-sm text-red-400 mt-1">{errors.address}</p>}
                    </div>
                  )}

                  {/* Выбор кофейни для самовывоза */}
                  {form.deliveryType === "pickup" && (
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-3">
                        {locale === "en" ? "Select pickup location" :
                         locale === "ky" ? "Кофекананы тандаңыз" :
                         "Выберите кофейню"}{" "}
                        <span className="text-red-400">*</span>
                      </label>

                      {pickupBranches.length === 0 ? (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-400">
                            {locale === "en"
                              ? "No pickup locations available at the moment."
                              : "Самовывоз временно недоступен. Пожалуйста, выберите доставку."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pickupBranches.map((branch) => {
                            const isSelected = selectedBranchId === branch.id;
                            return (
                              <button
                                key={branch.id}
                                type="button"
                                onClick={() => handleBranchSelect(branch.id)}
                                className={`w-full p-4 rounded-xl border-2 transition text-left ${
                                  isSelected
                                    ? "border-[#c9a96e] bg-[#c9a96e]/10"
                                    : "border-white/[0.08] hover:border-white/[0.15] bg-transparent"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Радио-кнопка */}
                                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-[#c9a96e]" : "border-white/30"}`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a96e]" />}
                                  </div>

                                  {/* Информация о филиале */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm ${isSelected ? "text-[#c9a96e]" : "text-[#f5f0e8]"}`}>
                                      {branch.name}
                                    </p>
                                    <p className="text-xs text-[rgba(245,240,232,0.55)] mt-0.5">
                                      📍 {branch.address}
                                    </p>
                                    {branch.hours && (
                                      <p className="text-xs text-[rgba(245,240,232,0.4)] mt-0.5">
                                        🕐 {branch.hours}
                                      </p>
                                    )}
                                    {branch.phone && (
                                      <p className="text-xs text-[rgba(245,240,232,0.4)] mt-0.5">
                                        📞 {formatPhone(branch.phone)}
                                      </p>
                                    )}
                                    {branch.statusNote && (
                                      <p className="text-xs text-amber-400/70 mt-1">
                                        ⚠ {branch.statusNote}
                                      </p>
                                    )}
                                  </div>

                                  {/* Маршрут */}
                                  {isSelected && (
                                    <a
                                      href={`https://2gis.kg/bishkek/geo/firm?q=${encodeURIComponent(branch.mapsQuery)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="shrink-0 text-xs text-[#c9a96e] hover:underline mt-0.5"
                                    >
                                      Маршрут →
                                    </a>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {errors.pickupBranch && (
                        <p className="text-sm text-red-400 mt-2">{errors.pickupBranch}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Комментарий */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    {i18n.checkout.commentTitle}
                  </h2>
                  <textarea
                    name="comment"
                    value={form.comment}
                    onChange={handleInputChange}
                    placeholder={i18n.checkout.commentPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#161411] border border-white/[0.08] rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition resize-none"
                  />
                </div>
              </div>

              {/* ── Итоги ─────────────────────────────────────────────────── */}
              <div className="lg:col-span-1">
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    {i18n.checkout.orderTitle}
                  </h2>

                  {/* Список товаров */}
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/[0.04] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#f5f0e8] truncate">{item.title}</p>
                          <p className="text-xs text-[rgba(245,240,232,0.5)]">
                            {item.quantity} × {item.price} с
                          </p>
                        </div>
                        <p className="text-sm font-medium text-[#c9a96e]">
                          {(item.price * item.quantity).toLocaleString("ru-KG")} с
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-white/[0.08] mb-4" />

                  {/* Выбранный способ получения */}
                  <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <p className="text-xs text-[rgba(245,240,232,0.4)] uppercase tracking-wider">
                      {form.deliveryType === "pickup" ? "Самовывоз" : "Доставка"}
                    </p>
                    {form.deliveryType === "delivery" && form.address && (
                      <p className="text-sm text-[#f5f0e8]">{form.address}</p>
                    )}
                    {form.deliveryType === "pickup" && selectedBranch && (
                      <>
                        <p className="text-sm font-medium text-[#c9a96e]">{selectedBranch.name}</p>
                        <p className="text-xs text-[rgba(245,240,232,0.5)]">{selectedBranch.address}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedBranchId("")}
                          className="text-xs text-white/30 hover:text-white/60 transition mt-0.5"
                        >
                          Изменить →
                        </button>
                      </>
                    )}
                    {form.deliveryType === "pickup" && !selectedBranch && (
                      <p className="text-sm text-amber-400/70">Кофейня не выбрана</p>
                    )}
                  </div>

                  <div className="h-px bg-white/[0.08] mb-4" />

                  {/* Суммы */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-[rgba(245,240,232,0.6)]">
                      <span>{i18n.checkout.subtotal} ({itemCount})</span>
                      <span>{totalAmount.toLocaleString("ru-KG")} {i18n.menu.currency}</span>
                    </div>
                    {appliedPromocode && (
                      <div className="flex justify-between text-green-400">
                        <div>
                          <span>{i18n.checkout.promocodeApplied}</span>
                          <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded">
                            {appliedPromocode.code}
                          </span>
                        </div>
                        <span>-{appliedPromocode.discountAmount.toLocaleString("ru-KG")} {i18n.menu.currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[rgba(245,240,232,0.6)]">
                      <span>{i18n.checkout.delivery}</span>
                      <span>{i18n.checkout.deliveryFreeValue}</span>
                    </div>
                    <div className="h-px bg-white/[0.08]" />
                    <div className="flex justify-between text-lg font-semibold text-[#f5f0e8]">
                      <span>{i18n.checkout.total}</span>
                      <span className="text-[#c9a96e]">
                        {(totalAmount - (appliedPromocode?.discountAmount || 0)).toLocaleString("ru-KG")} {i18n.menu.currency}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (form.deliveryType === "pickup" && pickupBranches.length === 0)}
                    className="w-full h-12 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0f0d0b]/30 border-t-[#0f0d0b] rounded-full animate-spin" />
                        {i18n.checkout.submitting}
                      </>
                    ) : (
                      <>
                        {i18n.checkout.payBtn}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </>
                    )}
                  </button>

                  <Link
                    href="/cart"
                    className="mt-3 block w-full h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.08] transition flex items-center justify-center"
                  >
                    {i18n.checkout.backToCart}
                  </Link>

                  <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-[rgba(245,240,232,0.5)] text-center">
                      {i18n.checkout.securePayment}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
