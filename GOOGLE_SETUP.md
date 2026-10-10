# Быстрая настройка Google OAuth

## Шаг 1: Создать Google OAuth Client ID

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth Client ID**
5. Выберите **Web application**
6. Укажите имя (например, "Sierra Coffee Web")
7. Добавьте **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
8. Добавьте **Authorized redirect URIs**:
   ```
   http://localhost:3000
   ```
9. Нажмите **Create**
10. Скопируйте **Client ID** и **Client Secret**

## Шаг 2: Обновить .env файл

Откройте `.env` и замените placeholder значения на ваши реальные:

```env
GOOGLE_CLIENT_ID="ваш-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="ваш-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="ваш-client-id.apps.googleusercontent.com"
```

⚠️ **ВАЖНО:** Используйте один и тот же Client ID для обеих переменных!

## Шаг 3: Обновить базу данных

```bash
npx prisma db push
```

## Шаг 4: Перезапустить приложение

```bash
npm run dev
```

## Шаг 5: Проверить

1. Откройте http://localhost:3000/login
2. Вы должны увидеть кнопку "Continue with Google"
3. Нажмите на кнопку и войдите через Google
4. После входа вы будете перенаправлены на главную страницу
5. Ваш аватар и имя должны отображаться в шапке сайта

## Для production

Когда вы развернёте сайт в production:

1. Вернитесь в Google Cloud Console
2. Отредактируйте OAuth Client ID
3. Добавьте ваш production домен в **Authorized JavaScript origins**:
   ```
   https://your-domain.com
   ```
4. Добавьте ваш production домен в **Authorized redirect URIs**:
   ```
   https://your-domain.com
   ```
5. Обновите `.env` в production с теми же учётными данными

---

Готово! 🎉 Google OAuth теперь работает.

Подробная документация: см. `GOOGLE_OAUTH.md`
