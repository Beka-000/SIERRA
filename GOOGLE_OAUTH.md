# Google OAuth Implementation — Sierra Coffee

## Обзор

Google OAuth реализован как дополнительный способ входа на сайт Sierra Coffee. Пользователи могут войти через свой Google аккаунт или использовать существующую систему email/password.

## Что реализовано

### ✅ Backend

1. **API Route** — `/app/api/auth/google/route.ts`
   - Получает Google ID token от фронтенда
   - Проверяет токен через `google-auth-library`
   - Создаёт нового пользователя или находит существующего
   - Связывает Google аккаунт с существующим email при совпадении
   - Создаёт сессию и устанавливает cookie
   - Защита от заблокированных пользователей

2. **Database Schema Updates**
   - Добавлено поле `googleId` (unique) — стабильный идентификатор Google
   - Добавлено поле `googleAvatar` — URL аватара пользователя
   - Поле `passwordHash` теперь опциональное для Google-пользователей
   - Поле `phone` теперь опциональное для Google-пользователей

3. **Session Updates**
   - API `/api/auth/session` теперь возвращает `avatar` из базы данных
   - Аватар передаётся в контекст пользователя

### ✅ Frontend

1. **Login Page** — `/app/login/page.tsx`
   - Добавлена кнопка "Continue with Google"
   - Использует официальный Google Sign-In JavaScript SDK
   - Кнопка отображается в стиле Google (белая, с логотипом)
   - Разделитель "или" между Google и обычным логином
   - Обработка ошибок Google OAuth

2. **Profile Page** — `/app/profile/page.tsx`
   - Отображает Google аватар, если он есть
   - Показывает email и имя пользователя из Google

3. **Navbar** — `/app/components/Navbar.tsx`
   - Отображает Google аватар в шапке сайта
   - Fallback на инициал имени, если аватара нет

## Настройка Google OAuth

### 1. Создать Google OAuth Client

1. Перейти в [Google Cloud Console](https://console.cloud.google.com/)
2. Создать новый проект или выбрать существующий
3. Включить **Google+ API** или **Google Identity Services**
4. Перейти в **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Выбрать **Web application**
6. Добавить **Authorized JavaScript origins**:
   - `http://localhost:3000` (для разработки)
   - `https://your-domain.com` (для продакшена)
7. Добавить **Authorized redirect URIs**:
   - `http://localhost:3000`
   - `https://your-domain.com`
8. Сохранить **Client ID** и **Client Secret**

### 2. Обновить .env файл

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

⚠️ **ВАЖНО:**
- `GOOGLE_CLIENT_SECRET` никогда не должен попасть в frontend
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` используется только для инициализации Google SDK
- Добавьте `.env` в `.gitignore`

### 3. Запустить миграцию базы данных

```bash
npx prisma db push
```

Это добавит поля `googleId` и `googleAvatar` в таблицу `users`.

### 4. Перезапустить приложение

```bash
npm run dev
```

## Архитектура

```
┌─────────────────┐
│  Browser        │
│  (Login Page)   │
└────────┬────────┘
         │
         │ 1. Google Sign-In SDK
         │    (accounts.google.com/gsi/client)
         │
         ▼
┌─────────────────┐
│  Google OAuth   │
│  Authorization  │
└────────┬────────┘
         │
         │ 2. ID Token (credential)
         │
         ▼
┌─────────────────┐
│  POST           │
│  /api/auth/     │
│  google         │
└────────┬────────┘
         │
         │ 3. Verify Token
         │    (google-auth-library)
         │
         ▼
┌─────────────────┐
│  Database       │
│  - Find user    │
│  - Create user  │
│  - Link account │
└────────┬────────┘
         │
         │ 4. Create Session
         │    (JWT + Cookie)
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  Home Page      │
└─────────────────┘
```

## Обработка ситуаций

### ✅ Новый пользователь с Google

1. Пользователь нажимает "Continue with Google"
2. Выбирает Google аккаунт
3. Система проверяет, что `googleId` не существует в базе
4. Создаётся новый пользователь с ролью `client`
5. `passwordHash` остаётся `null` (Google-пользователи не имеют пароля)
6. Создаётся профиль
7. Устанавливается сессия
8. Редирект на главную страницу

### ✅ Существующий email

1. Пользователь входит через Google
2. Email уже существует в базе (зарегистрирован через email/password)
3. Система **связывает** Google аккаунт с существующим пользователем
4. Обновляются поля `googleId` и `googleAvatar`
5. Пользователь может теперь входить как через email/password, так и через Google

### ✅ Повторный вход

1. Пользователь с `googleId` снова входит через Google
2. Система находит пользователя по `googleId`
3. Обновляет аватар, если он изменился
4. Устанавливается сессия

### ✅ Заблокированный пользователь

1. Пользователь пытается войти через Google
2. Система проверяет `isBlocked`
3. Возвращается ошибка 403 "Account is blocked"
4. Сессия не создаётся

### ✅ Отмена авторизации

1. Пользователь нажимает "Continue with Google"
2. Закрывает окно Google без выбора аккаунта
3. Ничего не происходит, пользователь остаётся на странице логина

## Безопасность

### ✅ Серверная проверка токена

- Токен от Google проверяется на сервере через `google-auth-library`
- Фронтенд **не имеет доступа** к `GOOGLE_CLIENT_SECRET`
- Невозможно подделать токен

### ✅ Защита от подмены

- Используется `googleId` (sub claim) как уникальный идентификатор
- `googleId` уникален и не может быть изменён
- Email из Google может измениться, но `googleId` останется прежним

### ✅ HttpOnly Cookie

- Сессия хранится в HttpOnly cookie
- JavaScript не имеет доступа к токену сессии
- Защита от XSS

### ✅ HTTPS в продакшене

- Google OAuth требует HTTPS в production
- Только localhost может использовать HTTP

## Тестирование

### ✅ Сценарии для проверки

1. **Новый пользователь Google**
   - Войти через Google с новым email
   - Проверить, что пользователь создан в базе
   - Проверить, что аватар отображается
   - Проверить, что сессия работает после перезагрузки страницы

2. **Связывание аккаунтов**
   - Зарегистрироваться через email/password
   - Выйти
   - Войти через Google с тем же email
   - Проверить, что аккаунты связаны
   - Проверить, что можно войти через оба способа

3. **Повторный вход**
   - Войти через Google
   - Выйти
   - Войти через Google снова
   - Проверить, что всё работает

4. **Logout**
   - Войти через Google
   - Нажать "Выйти"
   - Проверить, что сессия удалена
   - Проверить, что редирект на главную страницу

5. **Обычный логин продолжает работать**
   - Войти через email/password
   - Проверить, что всё работает
   - Проверить, что Google OAuth не сломал существующую систему

6. **Console без ошибок**
   - Открыть DevTools → Console
   - Проверить, что нет ошибок при входе через Google
   - Проверить, что нет ошибок при загрузке страницы

7. **Секреты не в frontend**
   - Открыть DevTools → Network
   - Проверить, что `GOOGLE_CLIENT_SECRET` нигде не передаётся
   - Проверить, что только `NEXT_PUBLIC_GOOGLE_CLIENT_ID` используется

## Файлы изменений

```
prisma/schema.prisma                  # +googleId, +googleAvatar, phone?, passwordHash?
.env                                   # +GOOGLE_CLIENT_ID, +GOOGLE_CLIENT_SECRET, +NEXT_PUBLIC_GOOGLE_CLIENT_ID
app/api/auth/google/route.ts          # NEW: Google OAuth endpoint
app/api/auth/session/route.ts         # UPDATED: return avatar
app/login/page.tsx                     # UPDATED: +Google Sign-In button
app/profile/page.tsx                   # UPDATED: show Google avatar
app/components/Navbar.tsx              # UPDATED: show Google avatar in header
```

## Дополнительно

### Локализация

Кнопка Google Sign-In автоматически локализуется на основе языка браузера пользователя:
- Русский: "Войти через Google"
- English: "Continue with Google"
- Кыргызча: Google браузердин тилине ылайык локализациялайт

### Адаптивность

- Desktop: кнопка отображается на полную ширину формы
- Mobile: кнопка адаптируется под экран
- Google SDK автоматически подстраивает размер кнопки

### Производительность

- Google Sign-In SDK загружается асинхронно
- Не блокирует загрузку страницы
- Lazy loading для изображений аватаров

## Troubleshooting

### Ошибка: "Invalid client ID"

- Проверьте `NEXT_PUBLIC_GOOGLE_CLIENT_ID` в `.env`
- Убедитесь, что Client ID корректный из Google Cloud Console

### Ошибка: "Redirect URI mismatch"

- Добавьте текущий URL в Authorized redirect URIs в Google Cloud Console
- Для localhost: `http://localhost:3000`

### Кнопка Google не появляется

- Проверьте Console на наличие ошибок
- Убедитесь, что `NEXT_PUBLIC_GOOGLE_CLIENT_ID` установлен
- Проверьте, что Google SDK загрузился (`window.google`)

### Аватар не отображается

- Проверьте, что `googleAvatar` сохраняется в базе данных
- Проверьте Network tab — аватар должен загружаться с `lh3.googleusercontent.com`
- Проверьте, что `/api/auth/session` возвращает `avatar`

## Обслуживание

### Ротация Client Secret

1. Сгенерировать новый Client Secret в Google Cloud Console
2. Обновить `GOOGLE_CLIENT_SECRET` в `.env`
3. Перезапустить приложение
4. Старый секрет можно удалить после проверки

### Мониторинг

Логи ошибок Google OAuth:
```typescript
console.error("Google OAuth error:", error);
```

Можно подключить Sentry или другую систему мониторинга для отслеживания ошибок в production.

---

**Версия:** 1.0  
**Дата:** 2024  
**Статус:** ✅ Готово к использованию
