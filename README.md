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
ROUND_DURATION_SEC=60        # длительность раунда (сек)
COOLDOWN_DURATION_SEC=30     # длительность подготовительного периода (сек)

# CORS: список origins через запятую
CORS_ORIGINS=http://localhost:5173,http://localhost
```

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
