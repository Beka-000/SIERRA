# Sierra Coffee — Кофейня в Бишкеке

Современный сайт кофейни Sierra Coffee с онлайн-заказом, бронированием столиков и административной панелью.

## 🎯 Функциональность

### Клиентская часть
- ☕ **Главная страница** — атмосферная визуализация кофейни с фотографиями
- 📋 **Меню** — каталог напитков и блюд
- 🪑 **Бронирование** — онлайн-бронирование столиков
- 🔐 **Авторизация** — вход через email/password или **Google OAuth**
- 👤 **Личный кабинет** — профиль, история заказов и бронирований
- 🌍 **Мультиязычность** — русский, кыргызский, английский

### Административная панель
- 📊 **Dashboard** — статистика и аналитика
- 🛍️ **Заказы** — управление заказами в реальном времени
- 📖 **Меню** — редактирование продуктов и категорий
- 🎟️ **Промокоды** — создание и управление скидками
- ⭐ **Отзывы** — модерация отзывов клиентов
- 📝 **Audit Log** — журнал действий администраторов

### Система ролей (RBAC)
- **Admin** — полный доступ ко всем функциям
- **Manager** — управление меню и заказами
- **Staff** — просмотр заказов
- **Client** — обычный пользователь

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env` и заполните необходимые значения:

```env
DATABASE_URL="ваш-postgresql-url"
JWT_SECRET="ваш-секретный-ключ"

# Google OAuth (опционально, но рекомендуется)
GOOGLE_CLIENT_ID="ваш-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="ваш-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="ваш-google-client-id.apps.googleusercontent.com"

# Telegram уведомления (опционально)
TELEGRAM_BOT_TOKEN="ваш-telegram-bot-token"
TELEGRAM_ADMIN_CHAT_ID="ваш-telegram-chat-id"
```

**Настройка Google OAuth:** см. [`GOOGLE_SETUP.md`](./GOOGLE_SETUP.md)

### 3. Инициализация базы данных

```bash
npx prisma db push
npx prisma generate
```

### 4. Запуск dev-сервера

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📚 Технологический стек

- **Framework:** Next.js 15 (App Router)
- **Язык:** TypeScript
- **База данных:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Аутентификация:** JWT + Google OAuth 2.0
- **Стили:** Tailwind CSS
- **UI:** React Server Components
- **OAuth:** Google Sign-In (official)

## 🔐 Авторизация

### Email/Password
- Регистрация нового пользователя
- Вход с email или телефоном
- Хэширование паролей (SHA-256 + salt)
- JWT сессии в HttpOnly cookies

### Google OAuth
- Официальный Google Sign-In
- Автоматическое создание пользователя
- Связывание с существующим email
- Аватар из Google аккаунта

Подробнее: [`GOOGLE_OAUTH.md`](./GOOGLE_OAUTH.md)

## 🛠️ Команды

```bash
# Development
npm run dev

# Build production
npm run build
npm start

# TypeScript check
npx tsc --noEmit

# Prisma
npx prisma studio       # UI для базы данных
npx prisma db push      # Применить изменения схемы
npx prisma generate     # Сгенерировать Prisma Client
```

## 📁 Структура проекта

```
sierra-coffee/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Авторизация (login, register, google)
│   │   └── admin/        # Admin API
│   ├── components/        # React компоненты
│   ├── admin/            # Административная панель
│   ├── login/            # Страница входа
│   ├── profile/          # Личный кабинет
│   └── page.tsx          # Главная страница
├── lib/                   # Утилиты и хелперы
│   ├── auth.ts           # JWT, sessions
│   ├── i18n.ts           # Локализация
│   ├── AuthContext.tsx   # React context для auth
│   └── LocaleContext.tsx # React context для языка
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Статические файлы
```

## 🌐 Мультиязычность

Поддерживаемые языки:
- 🇷🇺 Русский (ru)
- 🇰🇬 Кыргызский (ky)
- 🇬🇧 English (en)

Локализация хранится в `lib/i18n.ts` и переключается через LocaleContext.

## 🎨 Дизайн

- **Цветовая схема:** Тёмная кофейная тема (#0f0d0b) с золотистыми акцентами (#c9a96e)
- **Типографика:** Playfair Display (заголовки) + Inter (основной текст)
- **Атмосфера:** Премиальная, уютная, минималистичная
- **Адаптивность:** Полностью responsive (mobile, tablet, desktop)

## 📄 Документация

- [**GOOGLE_SETUP.md**](./GOOGLE_SETUP.md) — Быстрая настройка Google OAuth
- [**GOOGLE_OAUTH.md**](./GOOGLE_OAUTH.md) — Подробная документация Google OAuth
- [**ТЗ_Sierra_Coffee.md**](./ТЗ_Sierra_Coffee.md) — Техническое задание проекта
- [**Sierra_Coffee_БД.md**](./Sierra_Coffee_БД.md) — Описание базы данных

## 🔒 Безопасность

- JWT токены в HttpOnly cookies
- Серверная проверка Google ID tokens
- RBAC на уровне middleware, API и клиента
- Защита от XSS и CSRF
- Хэширование паролей
- Environment variables для секретов

## 📦 Deployment

### Vercel (рекомендуется)

1. Push в GitHub
2. Импортировать проект в Vercel
3. Добавить environment variables
4. Обновить Google OAuth redirect URIs
5. Deploy

### Docker

```bash
docker build -t sierra-coffee .
docker run -p 3000:3000 sierra-coffee
```

## 🤝 Contributing

Pull requests приветствуются. Для больших изменений откройте issue для обсуждения.

## 📝 License

[MIT](https://choosealicense.com/licenses/mit/)

---

Made with ☕ for Sierra Coffee

