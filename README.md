# The Last of Guss

Monorepo: NestJS (Fastify) API, React (Vite) Web, Postgres. Запуск через Docker Compose (localhost-порты).

## Требования

- Docker Desktop / Docker Engine
- curl/jq (для примеров)

## Структура проекта

```
.
├─ docker-compose.yml           # запуск DB, API, Web
├─ .env                         # переменные окружения (корень)
├─ apps/
│  ├─ api/                      # NestJS + Prisma
│  │  ├─ src/
│  │  ├─ prisma/                # schema.prisma, seed.js
│  │  ├─ Dockerfile
│  │  └─ package.json
│  └─ web/                      # React + Vite
│     ├─ src/
│     ├─ Dockerfile
│     ├─ vite.config.ts
│     └─ package.json
└─ README.md
```

## Переменные окружения

Создайте `.env` в корне (или скопируйте `.env.example`):

```
# Postgres
POSTGRES_USER=guss
POSTGRES_PASSWORD=guss
POSTGRES_DB=guss

# API
JWT_SECRET=dev-secret
ROUND_DURATION=60        # длительность раунда (сек)
COOLDOWN_DURATION=30     # длительность подготовительного периода (сек)

# CORS: список origins через запятую
CORS_ORIGINS=http://localhost:5173,http://localhost
```

Примечание:

- Docker Compose для сервиса API читает переменные из файла `apps/api/.env` (см. `env_file` в `docker-compose.yml`).
- Переменные `POSTGRES_*` можно не задавать — в compose есть значения по умолчанию.

Для фронта `apps/web/.env` (или `apps/web/.env.example` → `.env`):

```
# Адрес API
VITE_API_HOST=localhost
VITE_API_PORT=3000
# альтернативно: VITE_API_BASE=http://localhost:3000
```

## Поднять сервер с нуля

1. Подготовить env-файлы (если ещё не созданы):

```
cp -n .env.example .env 2>/dev/null || true
cp -n apps/web/.env.example apps/web/.env 2>/dev/null || true
```

2. Собрать образы (без обязательной очистки):

```
docker compose build
```

3. Запустить контейнеры:

```
docker compose up -d
```

4. Применить миграции и выполнить сид (первый запуск, пустая БД):

```
docker compose exec -T api npx prisma migrate dev --name init
docker compose exec -T api node prisma/seed.js
```

5. Проверить доступность:

- Web: http://localhost:5173
- API: http://localhost:3000
- DB: localhost:5432

Проверка API:

```
curl http://localhost:3000/health
```

Логин:

```
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}'
```

### Пользователи и роли (сид‑данные)

Кратко:

Admin:
Логин: admin
Пароль: 123456

Nikita:
Логин: nikita
Пароль: 123456

Ivan:
Логин: ivan
Пароль: 123456

Пароль по умолчанию у всех: `123456`.

- `admin` — роль `admin`
  - может создавать раунды: `POST /rounds`
  - имеет доступ ко всем пользовательским возможностям
- `ivan` — роль `survivor`
  - обычный игрок: может тапать в активном раунде: `POST /rounds/:id/tap`
- `nikita` — роль `banned`
  - личные очки не начисляются (тапы не увеличивают `my.points`),
  - по умолчанию его тапы не влияют на итоги раунда (totalPoints/totalTaps).

Примеры логина:

```
curl -sS -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}' | jq

curl -sS -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ivan","password":"123456"}' | jq

curl -sS -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"nikita","password":"123456"}' | jq
```

Использование токена:

```
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/rounds/current
```

Как повторно применить сиды:

- если БД пустая (после первого запуска): достаточно `migrate dev` и `node prisma/seed.js` (см. шаги выше)
- если нужно перегенерировать данные с очисткой БД:

```
docker compose exec -T api npx prisma migrate reset --force
docker compose exec -T api node prisma/seed.js
```

## Полезные эндпоинты

- Пагинация раундов: `GET /rounds?cursorId=<id>&limit=20` → `{ items, nextCursor }`
- Данные для страницы раунда: `GET /rounds/:id/full`

## Примечания

- Фронт берёт адрес API из `VITE_API_BASE` либо из `VITE_API_HOST`/`VITE_API_PORT`.
- `.gitignore` исключает `node_modules` и `.env` в корне и приложениях.

## Локальный запуск без Docker (для разработки)

Рекомендуется запускать через Docker, но для локальной отладки можно поднять API напрямую:

1. Поднять Postgres локально (или в контейнере):

```
docker run -d --name guss-db-local \
  -e POSTGRES_USER=guss -e POSTGRES_PASSWORD=guss -e POSTGRES_DB=guss \
  -p 5432:5432 postgres:16-alpine
```

2. Применить схему и сид БД, собрать и запустить API:

```
cd apps/api
npm ci
DATABASE_URL=postgres://guss:guss@localhost:5432/guss npx prisma db push
DATABASE_URL=postgres://guss:guss@localhost:5432/guss node prisma/seed.js
npm run build
PORT=3000 JWT_SECRET=dev-secret ROUND_DURATION=60 COOLDOWN_DURATION=30 \
  DATABASE_URL=postgres://guss:guss@localhost:5432/guss node dist/main.js
```

3. Проверка:

```
curl http://localhost:3000/health
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}'
```

Замечание: файл `apps/api/.env` используется Docker Compose. Для локального запуска значения лучше передавать через переменные окружения (как в примерах выше).

## Локальный запуск фронтенда (web) без Docker

1. Подготовить переменные окружения фронта:

```
cp -n apps/web/.env.example apps/web/.env 2>/dev/null || true

# Либо создайте apps/web/.env c одним из вариантов
# Вариант 1 (рекомендуется): единая переменная базы API
VITE_API_BASE=http://localhost:3000

# Вариант 2: отдельные хост/порт
# VITE_API_HOST=localhost
# VITE_API_PORT=3000
```

2. Установить зависимости и запустить dev-сервер:

```
cd apps/web
npm ci
npm run dev
# Откройте http://localhost:5173
```

3. (Опционально) Сборка и предпросмотр прод-сборки локально:

```
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
# Откройте http://localhost:3000
```

Примечания:

- Убедитесь, что API доступен на адресе, указанном в `VITE_API_BASE` (или `VITE_API_HOST`/`VITE_API_PORT`).
- В API включите `CORS_ORIGINS` с `http://localhost:5173` (см. пример `.env`).
