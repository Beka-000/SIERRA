# 🚀 Быстрый старт - Корзина и оформление заказа

## Что реализовано

✅ Корзина с localStorage  
✅ Страница оформления заказа  
✅ Интеграция с Finik Pay  
✅ Webhook для обработки платежей  
✅ Админ-панель для управления заказами  

---

## Как запустить (5 минут)

### 1. Убедитесь, что установлены зависимости

```bash
npm install
```

### 2. Настройте переменные окружения

Создайте/обновите `.env.local`:

```env
# Database (уже должно быть)
DATABASE_URL="postgresql://..."

# Finik Pay (добавьте эти строки)
FINIK_ENV="beta"  # или "prod" для продакшена
FINIK_API_KEY="your-api-key"
FINIK_ACCOUNT_ID="your-account-id"
FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-private-key-here
-----END PRIVATE KEY-----"

# App URL (для webhook и redirect)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Запустите dev сервер

```bash
npm run dev
```

Откройте http://localhost:3000

---

## Как протестировать (2 минуты)

### Быстрый тест

1. **Откройте меню:** http://localhost:3000/menu
2. **Добавьте товар:** нажмите кнопку "+" на любой карточке
3. **Откройте корзину:** кликните иконку корзины в navbar
4. **Проверьте функции:** измените количество, удалите товар
5. **Оформите заказ:** нажмите "Оформить заказ"
6. **Заполните форму:**
   - Имя: Тест
   - Телефон: +996555123456
   - Выберите "Доставка"
   - Адрес: Тестовая 1
7. **Нажмите "Перейти к оплате"**

**Результат:** Должен создаться заказ и произойти редирект на Finik Pay (или страницу заказа)

### Проверка админ-панели

1. **Войдите в админку:** http://localhost:3000/admin/login
   - Email: kojomkulov2004@gmail.com
   - Password: admin1234!
2. **Откройте заказы:** http://localhost:3000/admin/orders
3. **Найдите свой заказ** в списке
4. **Кликните на заказ** → откроется детальная страница
5. **Измените статус:** кнопка "Изменить статус" → выберите "Подтверждён"

---

## Проверка базы данных

```bash
# Откройте Prisma Studio
npx prisma studio
```

Проверьте таблицы:
- **orders** - должен быть ваш заказ
- **order_items** - товары заказа
- **payments** - запись о платеже
- **cart_items** - должна быть пустой (очищается после заказа)

---

## Основные страницы

| Страница | URL | Описание |
|----------|-----|----------|
| Меню | `/menu` | Каталог с кнопками корзины |
| Корзина | `/cart` | Управление товарами |
| Оформление | `/checkout` | Форма заказа |
| Статус заказа | `/order/[id]` | Отслеживание заказа |
| Админ заказы | `/admin/orders` | Список всех заказов |
| Админ детали | `/admin/orders/[id]` | Управление заказом |

---

## API endpoints

### Публичные
- `GET /api/cart` - Получить корзину
- `POST /api/cart` - Добавить товар
- `PATCH /api/cart/[id]` - Изменить количество
- `DELETE /api/cart/[id]` - Удалить товар
- `POST /api/orders` - Создать заказ
- `GET /api/orders/[id]` - Детали заказа
- `POST /api/finik/webhook` - Webhook Finik Pay

### Админ (требуют авторизацию)
- `GET /api/admin/orders` - Список заказов
- `GET /api/admin/orders/[id]` - Детали (админ)
- `PATCH /api/admin/orders/[id]` - Обновить статус

---

## Типичные проблемы

### Заказ не создается

**Проверьте:**
1. Консоль браузера (F12) - есть ли ошибки?
2. Терминал (где запущен npm run dev) - логи сервера
3. База данных - подключение работает?

**Частые причины:**
- Корзина пуста
- Товар недоступен (is_available = false)
- Ошибка валидации формы

### Finik Pay не работает

**Проверьте:**
1. `.env.local` - все переменные FINIK_* заполнены?
2. FINIK_ENV - должен быть "beta" для тестов
3. Логи сервера - ищите "[Finik"

**Решение:**
- Для локальной разработки используйте FINIK_ENV="beta"
- Для тестирования webhook используйте ngrok

### Webhook не приходит

**Причина:** Локальный сервер недоступен извне

**Решение для локальной разработки:**
```bash
# Установите ngrok
brew install ngrok  # или скачайте с ngrok.com

# Запустите туннель
ngrok http 3000

# Используйте ngrok URL в Finik Pay webhook settings
# Например: https://abc123.ngrok.io/api/finik/webhook
```

---

## Документация

### Полная документация:
- **[CART_CHECKOUT_IMPLEMENTATION.md](./CART_CHECKOUT_IMPLEMENTATION.md)** - Архитектура и API
- **[CART_CHECKOUT_TESTING_GUIDE.md](./CART_CHECKOUT_TESTING_GUIDE.md)** - 9 сценариев тестирования
- **[CART_CHECKOUT_COMPLETE.md](./CART_CHECKOUT_COMPLETE.md)** - Итоговый отчет
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Статус реализации

### Кратко:
- **Корзина:** lib/CartContext.tsx
- **API:** app/api/cart/, app/api/orders/, app/api/finik/
- **Страницы:** app/cart/, app/checkout/, app/order/

---

## Следующие шаги

### Для production:

1. **Получите Finik Pay credentials:**
   - Зарегистрируйтесь на https://acquiring.averspay.kg
   - Получите API key, Account ID, Private key
   - Добавьте в `.env.local` с FINIK_ENV="prod"

2. **Настройте webhook:**
   - В кабинете Finik Pay укажите: `https://your-domain.com/api/finik/webhook`
   - Webhook должен быть публично доступен

3. **Протестируйте:**
   - Создайте реальный заказ
   - Оплатите через Finik Pay
   - Проверьте обновление статуса

### Опционально:

- Добавить email уведомления
- Настроить Telegram бот для админов
- Подключить аналитику заказов

---

## Поддержка

- **Finik Pay:** support@averspay.kg
- **Документация Finik:** https://docs.acquiring.averspay.kg

---

## Готово! 🎉

Корзина и оформление заказов полностью работают.  
Просто настройте Finik Pay credentials и начинайте принимать заказы!

**Версия:** 1.0.0  
**Статус:** ✅ Production Ready
