# 🚀 Finik Pay - Быстрый старт

## ✅ Интеграция завершена

Платежная система Finik Pay полностью интегрирована в Sierra Coffee.

---

## 📦 Что установлено

```bash
@mancho.devs/authorizer  # Библиотека для подписи запросов
```

---

## 📁 Созданные файлы

### Backend
- `lib/finik.ts` — основная библиотека
- `app/api/finik/create-payment/route.ts` — создание платежа
- `app/api/finik/webhook/route.ts` — обработка webhook

### Frontend
- `components/FinikPaymentButton.tsx` — готовая кнопка оплаты
- `app/payment-success/page.tsx` — страница успеха

---

## 💰 Цена

**Фиксированная цена: 5 сомов**

Не берется из базы данных, как требовалось.

---

## 🎯 Как использовать

### Пример 1: Простая кнопка

```tsx
import FinikPaymentButton from "@/components/FinikPaymentButton";

<FinikPaymentButton
  orderId="order-123"
  orderDescription="Заказ в Sierra Coffee"
/>
```

### Пример 2: Кастомный вызов

```tsx
const response = await fetch("/api/finik/create-payment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId: "order-123",
    orderDescription: "Мой заказ",
  }),
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl;
```

---

## 🔄 Процесс

1. Пользователь → "Оплатить 5 сом"
2. Создание платежа → Finik API
3. Редирект → Страница Finik с QR-кодом
4. Оплата → Через приложение
5. Webhook → Обновление статуса заказа
6. Редирект → `/payment-success`

---

## ⚙️ Конфигурация (.env)

Все переменные уже настроены:

```env
FINIK_ENV="prod"
FINIK_API_KEY="WWeYjjsYE93LxEG5dI9Ce49zq5PD67yR7JfO51gC"
FINIK_ACCOUNT_ID="aadda212-e6ae-441f-8c9f-41e155849209"
FINIK_PRIVATE_KEY="..." (полный ключ настроен)
```

---

## ✅ Проверки

- [x] TypeScript компилируется без ошибок
- [x] Next.js build успешен
- [x] Все файлы созданы
- [x] Зависимости установлены
- [x] Переменные окружения настроены
- [x] Фиксированная цена 5 сомов
- [x] Webhook обрабатывает платежи
- [x] БД обновляется (Orders + Payments)

---

## 🧪 Тестирование

### Запуск

```bash
npm run dev
```

### Локальный webhook

```bash
ngrok http 3000
# Обновите NEXTAUTH_URL в .env на ngrok URL
```

---

## 📚 Документация

- `FINIK_INTEGRATION_GUIDE.md` — полная документация
- `FINIK_INTEGRATION_COMPLETE.md` — детали реализации

---

## 🎉 Готово!

Finik Pay интегрирован и готов к использованию.

**Цена:** 5 сомов (фиксированная)
**Окружение:** Production
**Статус:** Готов к приему платежей
