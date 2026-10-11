# 🔐 Учётные данные администратора Sierra Coffee

## Административная панель

### Доступ к панели администратора

**URL:** `http://localhost:3000/admin/login`

### Учётные данные (из seed-скриптов)

#### Основной админ-аккаунт:
```
Email:    admin@sierracoffee.kz
Пароль:   Admin@Sierra2024
```

#### Альтернативный админ-аккаунт (из prisma/seed.ts):
```
Email:    admin@sierracoffee.kg
Пароль:   admin123
```

---

## 🔒 2FA через Telegram

После ввода email и пароля система отправит одноразовый код (OTP) в Telegram.

**Telegram Admin Chat ID:** `1426762711`  
**Telegram Bot Token:** настроен в `.env`

---

## 👤 Роли и права

Система использует RBAC (Role-Based Access Control) с 5 ролями:

1. **admin** - Полный доступ ко всем разделам
2. **manager** - Управление заказами и меню
3. **staff** - Управление заказами
4. **client** - Обычный клиент
5. **guest** - Гость (ограниченный доступ)

---

## 📋 Разделы админ-панели

После успешного входа доступны следующие разделы:

- 📊 **Dashboard** (`/admin/dashboard`) - Статистика и аналитика
- 📦 **Заказы** (`/admin/orders`) - Управление заказами
- 🍕 **Меню** - Управление категориями, продуктами, модификаторами
  - `/admin/menu/categories` - Категории
  - `/admin/menu/products` - Товары
  - `/admin/menu/modifiers` - Модификаторы
- 🎫 **Промокоды** (`/admin/promocodes`) - Управление промокодами
- ⭐ **Отзывы** (`/admin/reviews`) - Модерация отзывов
- 👥 **Клиенты** (`/admin/clients`) - Управление пользователями
- 📜 **Audit Log** (`/admin/audit`) - История всех действий

---

## 🚀 Первый запуск

### 1. Запустите seed для создания тестовых данных:

```bash
# Вариант 1: Используя Prisma
npx prisma db seed

# Вариант 2: Используя tsx
npx tsx scripts/seed.ts
```

### 2. Запустите dev-сервер:

```bash
npm run dev
```

### 3. Откройте админ-панель:

```
http://localhost:3000/admin/login
```

### 4. Войдите используя учётные данные выше

---

## ⚙️ Смена пароля администратора

Если нужно изменить пароль, используйте bcrypt для генерации хеша:

```typescript
import bcrypt from 'bcryptjs';

const newPassword = 'ВашНовыйПароль123';
const hash = await bcrypt.hash(newPassword, 12);
console.log(hash);
```

Затем обновите в базе данных:

```sql
UPDATE users 
SET password_hash = 'ваш_новый_хеш' 
WHERE email = 'admin@sierracoffee.kz';
```

---

## 📱 Telegram интеграция

### Настройки из .env:

```env
TELEGRAM_BOT_TOKEN="8990620251:AAFlMz5hJLDZVuQYiS2hiUocGjfpa5On29E"
TELEGRAM_ADMIN_CHAT_ID="1426762711"
```

### Как получить свой Chat ID:

1. Откройте бота [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте `/start`
3. Бот вернёт ваш ID
4. Обновите `TELEGRAM_ADMIN_CHAT_ID` в `.env`

---

## 🔍 Проверка работы

### 1. Проверка подключения к БД:

```bash
npx prisma studio
```

### 2. Проверка существующего админа:

```sql
SELECT id, name, email, role_id 
FROM users 
WHERE email LIKE '%admin%';
```

### 3. Проверка ролей:

```sql
SELECT * FROM roles;
```

---

## 🆘 Устранение проблем

### Не получается войти?

1. **Проверьте, что seed выполнен:**
   ```bash
   npx prisma db seed
   ```

2. **Проверьте JWT_SECRET в .env:**
   ```env
   JWT_SECRET="sierra-coffee-jwt-secret-change-me-in-production-2024"
   ```

3. **Проверьте, что dev-сервер запущен:**
   ```bash
   npm run dev
   ```

4. **Очистите cookies браузера** и попробуйте снова

### Не приходит OTP в Telegram?

1. Убедитесь, что бот активен: `/start` боту
2. Проверьте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_ADMIN_CHAT_ID` в `.env`
3. Проверьте логи сервера на наличие ошибок

---

## 📚 Документация

- **Полное описание админ-панели:** `ADMIN_PANEL_README.md`
- **RBAC система:** `RBAC_IMPLEMENTATION.md`
- **Авторизация:** `AUTH_AND_I18N_IMPLEMENTATION.md`

---

**Дата создания:** 2024  
**Проект:** Sierra Coffee - Административная панель  
**Статус:** ✅ Готово к использованию
