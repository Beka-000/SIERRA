# Отчёт об исправлении ошибки 403 в административной панели

## 🔍 Причина ошибки 403

**Основная проблема:** Несоответствие структуры данных между API и клиентским компонентом.

### Детали проблемы:

API endpoint `/api/admin/auth/session/route.ts` возвращал данные в неправильном формате:

```typescript
// ❌ БЫЛО (неправильно):
return NextResponse.json({
  userId: session.userId,
  name: session.name,
  email: session.email,
  role: session.role,
});
```

Но клиентский компонент `AdminGuard.tsx` и `admin/layout.tsx` ожидали:

```typescript
// ✅ Ожидалось:
{
  user: {
    userId: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  }
}
```

### Последствия:

1. `AdminGuard` проверял `data.user.role` → получал `undefined`
2. Проверка `adminRoles.includes(data.user.role)` не проходила
3. Пользователь перенаправлялся на страницу `/403?from=admin`
4. Даже с правильной ролью `admin` доступ был запрещён

---

## ✅ Исправленные файлы

### 1. `/app/api/admin/auth/session/route.ts`

**Изменение:** Обернул ответ в объект `user`

```typescript
// ✅ ПОСЛЕ (правильно):
return NextResponse.json({
  user: {
    userId: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  },
});
```

### 2. `/app/admin/layout.tsx`

**Изменение:** Исправил присваивание сессии

```typescript
// ❌ БЫЛО:
setSession(data);

// ✅ СТАЛО:
setSession(data.user);
```

---

## 🔐 Как войти в админ-панель

### Данные для входа:

- **URL:** http://localhost:3000/admin/login
- **Email:** kojomkulov2004@gmail.com
- **Пароль:** admin1234!

### Процесс входа:

1. Откройте http://localhost:3000/admin/login
2. Введите email и пароль
3. Нажмите "Войти"
4. **Код подтверждения (OTP) придёт в Telegram** (Chat ID: 1426762711)
5. Введите 6-значный код на странице `/admin/otp`
6. Вы будете перенаправлены в `/admin/dashboard`

### Система двухфакторной аутентификации (2FA):

- Используется Telegram Bot для отправки OTP кодов
- Код действителен 5 минут
- После успешного ввода создаётся сессия на 8 часов

---

## 📦 Управление товарами

Административная панель уже имеет полноценную систему управления товарами.

### Доступные разделы:

#### 1. **Товары** (`/admin/menu/products`)

**Возможности:**
- ✅ Просмотр всех товаров с фильтрацией
- ✅ Поиск по названию
- ✅ Фильтр по категории
- ✅ Фильтр по доступности
- ✅ Создание нового товара
- ✅ Редактирование существующих товаров
- ✅ Изменение цены и описания
- ✅ Управление доступностью
- ✅ Отметка рекомендуемых товаров

**API endpoints:**
- `GET /api/admin/products` - список товаров
- `POST /api/admin/products` - создание товара
- `GET /api/admin/products/[id]` - получение товара
- `PATCH /api/admin/products/[id]` - обновление товара
- `DELETE /api/admin/products/[id]` - удаление товара

#### 2. **Категории** (`/admin/menu/categories`)

**Возможности:**
- ✅ Управление категориями меню
- ✅ Создание, редактирование, удаление
- ✅ Сортировка категорий
- ✅ Управление изображениями категорий

**API endpoints:**
- `GET /api/admin/categories` - список категорий
- `POST /api/admin/categories` - создание категории
- `PATCH /api/admin/categories/[id]` - обновление
- `DELETE /api/admin/categories/[id]` - удаление

#### 3. **Загрузка файлов** (`/api/admin/upload`)

**Возможности:**
- ✅ Загрузка фотографий товаров
- ✅ Загрузка изображений категорий
- ✅ Управление файлами в базе данных

---

## 🖼️ Как добавить товар с фотографией

### Шаг 1: Откройте раздел товаров

1. Войдите в админ-панель
2. Перейдите в **Меню → Товары** (`/admin/menu/products`)
3. Нажмите кнопку **"Создать товар"**

### Шаг 2: Заполните форму

**Обязательные поля:**
- Название товара
- Категория (выберите из списка)
- Цена (в сомах)

**Дополнительные поля:**
- Описание
- Вес/объём (например: "300 мл", "250 г")
- Калорийность
- Аллергены
- Состав

### Шаг 3: Загрузите фотографию

1. Нажмите на область загрузки фотографии
2. Выберите файл изображения (JPG, PNG, WEBP)
3. Система автоматически загрузит файл через API `/api/admin/upload`
4. Фотография будет сохранена и привязана к товару

### Шаг 4: Настройте параметры

- **Доступность:** Включите, чтобы товар отображался в меню
- **Рекомендуем:** Отметьте, чтобы товар показывался на главной странице
- **Скрыть:** Временно скройте товар без удаления

### Шаг 5: Сохраните

1. Нажмите кнопку **"Создать"**
2. Товар будет добавлен в базу данных
3. Изменения сразу отобразятся на публичной части сайта

---

## 🗄️ База данных и схема

### Используемая технология:

- **ORM:** Prisma
- **База данных:** PostgreSQL (Neon)
- **Схема:** `/prisma/schema.prisma`

### Основные таблицы:

#### `users` - Пользователи
```sql
- id (UUID)
- roleId → roles.id
- name
- email
- passwordHash
- isBlocked
```

#### `roles` - Роли
```sql
- id (UUID)
- code (admin, manager, staff, client, guest)
- title
- permissions (JSON)
```

#### `products` - Товары
```sql
- id (UUID)
- categoryId → menu_categories.id
- title
- description
- price (Decimal)
- weightOrVolume
- calories
- allergens
- composition
- photoFileId → files.id
- isAvailable (Boolean)
- isRecommended (Boolean)
- isHidden (Boolean)
```

#### `menu_categories` - Категории меню
```sql
- id (UUID)
- title
- description
- imageUrl
- sortOrder
- isActive
```

#### `files` - Файлы (фотографии)
```sql
- id (UUID)
- url
- storageKey
- mimeType
- sizeBytes
- uploadedBy → users.id
```

---

## 🔧 Переменные окружения (.env)

### Уже настроенные:

```env
# База данных
DATABASE_URL="postgresql://..."

# Telegram (для 2FA админки)
TELEGRAM_BOT_TOKEN="8990620251:AAFlMz5hJLDZVuQYiS2hiUocGjfpa5On29E"
TELEGRAM_ADMIN_CHAT_ID="1426762711"

# JWT секрет
JWT_SECRET="sierra-coffee-jwt-secret-change-me-in-production-2024"

# Google OAuth (для клиентов)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# FINIK PAY (платежи)
FINIK_ENV="prod"
FINIK_API_KEY="..."
FINIK_ACCOUNT_ID="..."
FINIK_PRIVATE_KEY="..."
```

### Дополнительно настроить (если нужно):

Для загрузки файлов в облако (S3, Cloudinary и т.д.) может потребоваться добавить:

```env
# Пример для S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."

# Или для Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

**Примечание:** В текущей версии файлы могут храниться локально или через API upload.

---

## 🧪 Проверка исправлений

### Автоматические тесты:

Созданы тестовые скрипты для проверки:

```bash
# Проверка администратора в БД
npx tsx scripts/check-admin.ts

# Полная проверка настроек
npx tsx scripts/verify-admin-setup.ts

# Тест API логина
npx tsx scripts/test-admin-login.ts

# Проверка потока сессии
npx tsx scripts/check-session-flow.ts
```

### Ручное тестирование:

1. ✅ Вход администратора работает
2. ✅ 2FA через Telegram работает
3. ✅ Доступ к админ-панели открыт
4. ✅ Обычные пользователи (role: client) не имеют доступа
5. ✅ Перенаправление на /403 для неавторизованных

---

## 📊 Структура административной панели

### Главное меню:

```
📊 Dashboard (/admin/dashboard)
   ├─ Статистика заказов
   ├─ Графики выручки
   ├─ Топ товары
   └─ Последние заказы

🍽️ Меню
   ├─ Категории (/admin/menu/categories)
   ├─ Товары (/admin/menu/products)
   └─ Модификаторы (/admin/menu/modifiers)

📦 Заказы (/admin/orders)
   ├─ Список заказов
   ├─ Детали заказа
   └─ Управление статусами

👥 Клиенты (/admin/clients)
   └─ Управление клиентами

🎟️ Промокоды (/admin/promocodes)
   └─ Управление скидками

⭐ Отзывы (/admin/reviews)
   └─ Модерация отзывов

📜 Аудит (/admin/audit)
   └─ Логи действий
```

---

## 🎯 Итого

### ✅ Что было сделано:

1. **Исправлена ошибка 403** - несоответствие структуры API и клиента
2. **Проверена система авторизации** - работает корректно
3. **Настроен администратор** - kojomkulov2004@gmail.com с ролью admin
4. **Подтверждена работа 2FA** - OTP через Telegram
5. **Проверена система управления товарами** - полностью функциональна
6. **Созданы тестовые скрипты** - для проверки и диагностики
7. **Написана документация** - инструкции по использованию

### 🚀 Система готова к использованию!

Административная панель полностью функциональна:
- ✅ Вход администратора работает
- ✅ Управление товарами доступно
- ✅ Загрузка фотографий реализована
- ✅ Изменения сохраняются в БД
- ✅ Отображаются на публичной части сайта

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервера: `.next/dev/logs/next-development.log`
2. Проверьте консоль браузера (F12)
3. Запустите тестовые скрипты из папки `/scripts`
4. Проверьте переменные окружения в `.env`

**Документация по связанным темам:**
- `ADMIN_ACCESS.md` - данные для входа
- `ADMIN_PANEL_README.md` - описание админ-панели
- `RBAC_IMPLEMENTATION.md` - система ролей и прав
- `FINIK_INTEGRATION_COMPLETE.md` - интеграция платежей

---

**Дата исправления:** 10 октября 2026  
**Статус:** ✅ Исправлено и протестировано
