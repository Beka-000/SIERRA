# База данных Sierra Coffee

**СУБД:** PostgreSQL
**ORM:** Prisma (или аналогичный)

---

## Содержание

1. [Users](#1-users)
2. [Roles](#2-roles)
3. [Profiles](#3-profiles)
4. [MenuCategories](#4-menucategories)
5. [Products](#5-products)
6. [ProductModifiers](#6-productmodifiers)
7. [Orders](#7-orders)
8. [OrderItems](#8-orderitems)
9. [Payments](#9-payments)
10. [Reservations](#10-reservations)
11. [Tables](#11-tables)
12. [Promocodes](#12-promocodes)
13. [LoyaltyAccounts](#13-loyaltyaccounts)
14. [Notifications](#14-notifications)
15. [Files](#15-files)
16. [Reviews](#16-reviews)
17. [ActivityLogs](#17-activitylogs)
18. [ER-диаграмма связей](#18-er-диаграмма-связей)

---

## 1. Users

Пользователи системы: клиенты и сотрудники.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор пользователя |
| role_id | UUID (FK → Roles.id) | Роль пользователя |
| name | VARCHAR | Имя |
| phone | VARCHAR (UNIQUE) | Телефон |
| email | VARCHAR (UNIQUE, NULLABLE) | Email |
| password_hash | VARCHAR | Хеш пароля |
| is_blocked | BOOLEAN | Признак блокировки |
| notifications_consent | BOOLEAN | Согласие на уведомления |
| created_at | TIMESTAMP | Дата регистрации |
| updated_at | TIMESTAMP | Дата обновления |

---

## 2. Roles

Роли и права доступа.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор роли |
| code | VARCHAR (UNIQUE) | Код роли (guest, client, staff, kitchen, manager, admin) |
| title | VARCHAR | Название роли |
| permissions | JSONB | Набор прав доступа |

---

## 3. Profiles

Расширенные данные клиента.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор профиля |
| user_id | UUID (FK → Users.id, UNIQUE) | Владелец профиля |
| favorite_products | UUID[] | Избранные блюда (FK → Products.id) |
| avatar_file_id | UUID (FK → Files.id, NULLABLE) | Аватар |
| birth_date | DATE (NULLABLE) | Дата рождения |
| notes | TEXT (NULLABLE) | Заметки менеджера о клиенте |

---

## 4. MenuCategories

Категории меню.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор категории |
| title | VARCHAR | Название |
| sort_order | INTEGER | Порядок отображения |
| is_active | BOOLEAN | Признак активности |
| created_at | TIMESTAMP | Дата создания |

---

## 5. Products

Блюда меню.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор блюда |
| category_id | UUID (FK → MenuCategories.id) | Категория |
| title | VARCHAR | Название |
| description | TEXT | Описание состава |
| price | DECIMAL(10,2) | Цена |
| weight_or_volume | VARCHAR | Вес/объём |
| allergens | TEXT (NULLABLE) | Аллергены |
| photo_file_id | UUID (FK → Files.id, NULLABLE) | Фотография |
| is_available | BOOLEAN | Доступность |
| is_recommended | BOOLEAN | Признак рекомендуемого блюда |
| is_hidden | BOOLEAN | Скрыто без удаления |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

---

## 6. ProductModifiers

Модификаторы блюд (добавки, опции).

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор модификатора |
| product_id | UUID (FK → Products.id) | Блюдо |
| title | VARCHAR | Название модификатора |
| price_delta | DECIMAL(10,2) | Доплата (может быть 0) |
| is_active | BOOLEAN | Доступность модификатора |

---

## 7. Orders

Заказы.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор заказа |
| order_number | VARCHAR (UNIQUE) | Номер заказа |
| user_id | UUID (FK → Users.id, NULLABLE) | Клиент (может быть гостем) |
| customer_name | VARCHAR | Имя получателя |
| customer_phone | VARCHAR | Телефон |
| customer_email | VARCHAR (NULLABLE) | Email |
| fulfillment_type | ENUM | `dine_in`, `pickup`, `delivery` |
| delivery_address | TEXT (NULLABLE) | Адрес доставки |
| desired_time | TIMESTAMP (NULLABLE) | Желаемое время |
| comment | TEXT (NULLABLE) | Комментарий к заказу |
| payment_method | ENUM | `cash`, `card`, `online` |
| promocode_id | UUID (FK → Promocodes.id, NULLABLE) | Применённый промокод |
| subtotal | DECIMAL(10,2) | Сумма без скидки |
| discount_amount | DECIMAL(10,2) | Размер скидки |
| total_amount | DECIMAL(10,2) | Итоговая сумма |
| status | ENUM | `NEW`, `CONFIRMED`, `COOKING`, `READY`, `OUT_FOR_DELIVERY`, `COMPLETED`, `CANCELLED` |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

---

## 8. OrderItems

Позиции заказа.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор позиции |
| order_id | UUID (FK → Orders.id) | Заказ |
| product_id | UUID (FK → Products.id) | Блюдо |
| modifiers | JSONB | Выбранные модификаторы (снимок на момент заказа) |
| quantity | INTEGER | Количество |
| unit_price | DECIMAL(10,2) | Цена за единицу на момент заказа |
| comment | TEXT (NULLABLE) | Комментарий к позиции |
| line_total | DECIMAL(10,2) | Стоимость позиции |

---

## 9. Payments

Платежи.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор платежа |
| order_id | UUID (FK → Orders.id) | Связанный заказ |
| provider | VARCHAR | Платёжный провайдер |
| provider_payment_id | VARCHAR (NULLABLE) | Идентификатор платежа у провайдера |
| status | ENUM | `created`, `pending`, `success`, `failed`, `cancelled` |
| amount | DECIMAL(10,2) | Сумма платежа |
| webhook_payload | JSONB (NULLABLE) | Данные последнего webhook |
| idempotency_key | VARCHAR (UNIQUE) | Защита от повторной обработки |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

---

## 10. Reservations

Бронирования столиков.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор брони |
| table_id | UUID (FK → Tables.id) | Столик |
| user_id | UUID (FK → Users.id, NULLABLE) | Клиент (может быть гостем) |
| customer_name | VARCHAR | Имя |
| customer_phone | VARCHAR | Телефон |
| date | DATE | Дата брони |
| start_time | TIME | Время начала |
| duration_minutes | INTEGER | Продолжительность |
| guests_count | INTEGER | Количество гостей |
| comment | TEXT (NULLABLE) | Комментарий |
| status | ENUM | `PENDING`, `CONFIRMED`, `ARRIVED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

> Ограничение уровня БД / бизнес-логики: пересекающиеся интервалы бронирования для одного `table_id` не допускаются (проверка при сохранении).

---

## 11. Tables

Столики кафе.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор столика |
| number | INTEGER (UNIQUE) | Номер столика |
| capacity | INTEGER | Вместимость (кол-во мест) |
| zone | VARCHAR | Зона расположения |
| status | ENUM | `available`, `unavailable`, `maintenance` |

---

## 12. Promocodes

Промокоды.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор промокода |
| code | VARCHAR (UNIQUE) | Код промокода |
| discount_type | ENUM | `percent`, `fixed` |
| discount_value | DECIMAL(10,2) | Размер скидки |
| min_order_amount | DECIMAL(10,2) (NULLABLE) | Минимальная сумма заказа |
| applicable_products | UUID[] (NULLABLE) | Ограничение по блюдам |
| applicable_categories | UUID[] (NULLABLE) | Ограничение по категориям |
| usage_limit | INTEGER (NULLABLE) | Лимит использований |
| used_count | INTEGER | Сколько раз использован |
| valid_from | TIMESTAMP | Начало действия |
| valid_until | TIMESTAMP | Окончание действия |
| is_active | BOOLEAN | Активность |

---

## 13. LoyaltyAccounts

Бонусные счета клиентов.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор счёта |
| user_id | UUID (FK → Users.id, UNIQUE) | Владелец счёта |
| balance | DECIMAL(10,2) | Текущий баланс бонусов |
| accrual_percent | DECIMAL(5,2) | Процент начисления |
| last_transaction_at | TIMESTAMP (NULLABLE) | Дата последней операции |

> Дополнительно может потребоваться таблица `LoyaltyTransactions` (начисление/списание) — начисление, списание, дата, сумма, связанный заказ.

---

## 14. Notifications

Уведомления пользователям.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор уведомления |
| user_id | UUID (FK → Users.id, NULLABLE) | Получатель |
| type | ENUM | `order_created`, `order_confirmed`, `order_status_changed`, `order_ready`, `order_cancelled`, `reservation_created`, `reservation_reminder`, `reservation_changed`, `reservation_cancelled`, `system` |
| channel | ENUM | `cabinet`, `email`, `telegram`, `sms` |
| payload | JSONB | Данные уведомления |
| is_read | BOOLEAN | Прочитано/не прочитано |
| sent_at | TIMESTAMP (NULLABLE) | Дата отправки |
| created_at | TIMESTAMP | Дата создания |

---

## 15. Files

Файлы (фото блюд и прочие материалы), хранящиеся в объектном хранилище.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор файла |
| url | VARCHAR | Ссылка в объектном хранилище |
| storage_key | VARCHAR | Ключ объекта в хранилище |
| mime_type | VARCHAR | MIME-тип |
| size_bytes | BIGINT | Размер файла |
| uploaded_by | UUID (FK → Users.id, NULLABLE) | Кто загрузил |
| created_at | TIMESTAMP | Дата загрузки |

---

## 16. Reviews

Отзывы клиентов.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор отзыва |
| user_id | UUID (FK → Users.id, NULLABLE) | Автор |
| order_id | UUID (FK → Orders.id, NULLABLE) | Связанный заказ |
| product_id | UUID (FK → Products.id, NULLABLE) | Связанное блюдо |
| rating | INTEGER | Оценка (1–5) |
| text | TEXT (NULLABLE) | Текст отзыва |
| is_published | BOOLEAN | Признак публикации |
| created_at | TIMESTAMP | Дата создания |

---

## 17. ActivityLogs

Журналы действий (для администратора).

| Поле | Тип | Описание |
|---|---|---|
| id | UUID (PK) | Идентификатор записи |
| user_id | UUID (FK → Users.id, NULLABLE) | Автор действия |
| action | VARCHAR | Тип действия |
| entity_type | VARCHAR | Тип сущности (Order, Product, User и т.д.) |
| entity_id | UUID (NULLABLE) | Идентификатор сущности |
| details | JSONB (NULLABLE) | Дополнительные данные |
| created_at | TIMESTAMP | Дата и время действия |

---

## 18. ER-диаграмма связей

```
Roles (1) ──────< Users (M)
Users (1) ──────< Profiles (1)
Users (1) ──────< Orders (M)
Users (1) ──────< Reservations (M)
Users (1) ──────< LoyaltyAccounts (1)
Users (1) ──────< Notifications (M)
Users (1) ──────< Reviews (M)
Users (1) ──────< ActivityLogs (M)

MenuCategories (1) ──────< Products (M)
Products (1) ──────< ProductModifiers (M)
Products (1) ──────< OrderItems (M)
Products (1) ──────< Reviews (M)

Orders (1) ──────< OrderItems (M)
Orders (1) ──────< Payments (M)
Orders (M) >────── Promocodes (1) [опционально]
Orders (1) ──────< Reviews (M)

Tables (1) ──────< Reservations (M)

Files (1) ──────< Products (M)   [photo_file_id]
Files (1) ──────< Profiles (1)   [avatar_file_id]
```

### Ключевые связи (текстом)

- один пользователь — много заказов
- один заказ — много позиций (OrderItems)
- одна категория — много блюд
- один столик — много бронирований в разные интервалы (без пересечений)
- один заказ — связанные события оплаты (Payments)
- один пользователь — один бонусный счёт (LoyaltyAccounts)
