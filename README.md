# USOF (Underflow Stack Overflow)
Монорепозиторій: **Node.js + Express + MySQL** (чистий SQL без ORM) та **React 18 + Redux Toolkit + чистий CSS3** (без сторонніх CSS-фреймворків).

---

## 1. Швидкий запуск (Quick Start)

### Крок 1. Встановлення залежностей
Встановлює модулі для кореня, бекенду та фронтенду в одну команду:
```bash
npm run install:all
```
*(або вручну: `npm install` та `npm --prefix web install`)*

---

### Крок 2. Змінні середовища (.env)
Створіть файл `.env` у корені проєкту (скопіювавши `.env.example`):
```bash
cp .env.example .env
```
Вкажіть ваші дані до локального MySQL:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ваш_пароль_від_mysql
DB_NAME=usof

# Дані початкового адміністратора
ADMIN_LOGIN=initial-admin
ADMIN_EMAIL=admin@example.com
ADMIN_FULL_NAME=Initial Administrator
ADMIN_PASSWORD=AdminSecurePass2026!
ADMIN_EMAIL_VERIFIED=true

APP_URL=http://localhost:3000
EMAIL_FROM=no-reply@usof.local
```

---

### Крок 3. Налаштування бази даних (MySQL)

> [!TIP]
> **Швидкий старт в одну команду (скидання + створення таблиць + наповнення + створення адміна):**
> ```bash
> npm run db:reset
> ```

#### Окремі команди для керування БД:
| Команда | Опис |
|---|---|
| `npm run db:init` | Створює базу даних `usof`, усі необхідні таблиці, зовнішні ключі та обмеження |
| `npm run db:seed` | Наповнює базу тестовими користувачами, категоріями, постами та коментарями |
| `npm run admin:create` | Створює обліковий запис адміністратора за даними з `.env` |
| `npm run db:clean` | Очищає таблиці бази даних від даних |
| `npm run db:reset` | Повний цикл: очищення -> ініціалізація -> сиди -> створення адміна |

---

### Крок 4. Запуск проєкту

Відкрийте **два окремих термінали**:

**Термінал 1 (Бекенд API — порт 3000):**
```bash
npm run dev:api
```
*(або `npm start`)*

**Термінал 2 (Фронтенд клієнт — порт 3001):**
```bash
npm run dev:web
```
*(або `npm --prefix web start`)*

* Клієнтська частина відкриється у браузері: **`http://localhost:3001`**
* Сервер API доступний за адресою: **`http://localhost:3000`**

---

## 2. Тестові облікові записи (для перевірки та захисту)

Усі тестові користувачі (`user1` .. `user7`), створені командою `npm run db:seed`, мають пароль: `Password123!`.

| Роль | Логін | Email | Пароль | Призначення |
|---|---|---|---|---|
| **Administrator** | `initial-admin` | `admin@example.com` | `AdminSecurePass2026!` *(з `.env`)* | Повний доступ до модерації, керування користувачами (ролі, бан) та категоріями |
| **User (Автор)** | `user1` | `user1@example.com` | `Password123!` | Перевірка дій автора: редагування свого поста, вибір кращої відповіді (`Accepted Solution`) |
| **User (Користувач)** | `user2` | `user2@example.com` | `Password123!` | Перевірка дій звичайного користувача: лайки/дизлайки, коментування, підписки |

---

## 3. Стек технологій та обмеження ТЗ

### Backend
* **Node.js** + **Express 5** (RESTful API, MVC архітектура).
* **MySQL 8** (використання драйвера `mysql2/promise`, пул з'єднань).
* **Сувора заборона ORM:** Жодних Sequelize / Prisma / TypeORM — виключно чистий параметризований SQL (`?` плейсхолдери) для захисту від SQL-ін'єкцій.
* **Безпека:** Нативний `node:crypto` (`scrypt`) з індивідуальною криптографічною сіллю для паролів, токенна сесійна автентифікація (`Bearer <token>`).
* **Файли:** `Multer` для безпечного завантаження аватарок та ілюстрацій до постів.
* **Пошта:** `Nodemailer` для скидання паролів та поштових сповіщень.

### Frontend
* **React 18** (функціональні компоненти, хуки).
* **Redux Toolkit** (централізоване керування глобальним станом).
* **React Router DOM v6** (маршрутизація, захищені роути `ProtectedRoute`, `AdminRoute`).
* **Чистий CSS3:** Використання **CSS Modules** (`*.module.css`), **Flexbox** та нативних CSS-змінних (`:root`).
* **Сувора заборона CSS-фреймворків:** Повна відмова від Bootstrap, Tailwind, MUI тощо відповідно до вимог челенджу.
* **Редактор:** TinyMCE (`@tinymce/tinymce-react`) для безпечного форматування коду й тексту.

---

## 4. Структура проєкту

```text
USOF-FRONTEND/
├── API/                       # Серверна частина (Node.js, Express, MySQL)
│   ├── src/
│   │   ├── config/            # Підключення до БД, аутентифікація, змінні середовища
│   │   ├── controllers/       # Контролери обробки HTTP-запитів
│   │   ├── database/          # Схема таблиць (schema.js) та початкові дані (seedData.js)
│   │   ├── middlewares/       # Перевірка токенів, ролей, обробка помилок, multer
│   │   ├── models/            # Репозиторії з прямими SQL-запитами (Repository pattern)
│   │   ├── routes/            # Маршрути API (/auth, /users, /posts, /comments, /categories)
│   │   ├── scripts/           # Скрипти БД (init, seed, reset, clean, createAdmin)
│   │   ├── services/          # Бізнес-логіка додатку
│   │   └── validators/        # Валідація вхідних даних (ajv / кастомна)
│   └── server.js              # Точка входу сервера API
├── uploads/                   # Збережені завантаження користувачів
│   ├── avatars/               # Фотографії профілів
│   └── posts/                 # Зображення до публікацій
├── web/                       # Клієнтська частина (React 18 SPA)
│   ├── public/                # index.html, favicon, manifest
│   └── src/
│       ├── api/               # Клієнт Axios та перехоплювачі токенів
│       ├── components/        # Загальні компоненти (Header, Sidebar, Footer, PostCard тощо)
│       ├── pages/             # Екрани додатку (Feed, PostDetails, Profile, Admin, Auth)
│       ├── redux/             # Слайси стану Redux (auth, posts, comments, categories)
│       └── styles/            # Глобальні стилі та CSS-змінні
├── .env.example               # Шаблон конфігурації
├── package.json               # Кореневий файл оркестрації запуску
└── README.md                  # Документація проєкту
```

---

## 5. Додатковий функціонал (Creative Features за ТЗ)

1. **Обране (Favorites):** Можливість зберігати публікації в закладки користувача та переглядати їх у вкладці «Обране» в особистому кабінеті.
2. **Підписки на пости (Subscriptions & Email Alerts):** Користувач може підписатися на оновлення будь-якого поста для отримання сповіщень про нові відповіді.
3. **Прийняте рішення (Accepted Solution):** Автор питання може офіційно позначити коментар як вирішення (`is_solution = 1`), після чого він закріплюється на самій вершині списку відповідей із зеленим бейджем.
4. **Ілюстрації до постів:** Завантаження картинок або діаграм до публікації з переглядом у повному розмірі.
5. **Наскрізний єдиний Footer:** Інформаційний підвал на всіх сторінках з адаптивним компонуванням.

---

## 6. Основні маршрути API (API Reference)

| Метод | Маршрут | Доступ | Опис |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Реєстрація нового користувача |
| `POST` | `/api/auth/login` | Public | Авторизація, повертає Bearer токен |
| `POST` | `/api/auth/logout` | Auth | Вихід із системи (відкликання токена) |
| `POST` | `/api/auth/password-reset` | Public | Запит на відновлення пароля |
| `POST` | `/api/auth/password-reset/:token` | Public | Встановлення нового пароля за токеном |
| `GET` | `/api/posts` | Public | Стрічка постів (фільтри, пошук, пагінація, сортування) |
| `POST` | `/api/posts` | Auth | Створення нової публікації |
| `PATCH` | `/api/posts/:id` | Автор / Admin | Редагування поста (текст, категорії, статус) |
| `DELETE` | `/api/posts/:id` | Автор / Admin | Видалення публікації |
| `GET` | `/api/posts/:id/comments` | Public | Отримання відповідей до поста (рішення закріплено зверху) |
| `POST` | `/api/posts/:id/comments` | Auth | Додавання коментаря або відповіді на коментар |
| `PATCH` | `/api/comments/:id/solution` | Автор поста / Admin | Призначення коментаря як офіційного рішення |
| `POST` | `/api/posts/:id/like` | Auth | Встановлення або перемикання реакції (like/dislike) |
| `POST` | `/api/posts/:id/favorite` | Auth | Додавання поста в обране |
| `POST` | `/api/posts/:id/subscribe` | Auth | Підписка на оновлення поста |
| `GET` | `/api/users/:id` | Public / Auth | Профіль користувача |
| `PATCH` | `/api/users/avatar` | Auth | Завантаження нового аватара |
| `GET` | `/api/users` | Admin | Список усіх користувачів (адмін-панель) |
