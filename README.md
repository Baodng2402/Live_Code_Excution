# 🚀 Edtronaut - Live Code Execution Backend
> Author: Dang Nguyen Gia Bao

> Backend Engineering Intern Assignment

## 📖 Overview
Backend to submit and execute code asynchronously. HTTP requests stay fast by pushing work to a queue and processing in a worker.

```mermaid
graph LR
    User[Client / UI] -->|1. Submit Code| API[API Server]
    API -->|2. Create Record| DB[(PostgreSQL)]
    API -->|3. Push Job| Redis[(Redis Queue)]
    API -->|4. Return 'QUEUED'| User
    Worker[Worker Service] -->|5. Pop Job| Redis
    Worker -->|6. Execute Code| Runtime[Node/Python]
    Runtime -->|7. Output| Worker
    Worker -->|8. Update Status| DB
    User -->|9. Poll Status| API
```

## 🧩 Stack
- Node.js, TypeScript, Express
- BullMQ + Redis for queueing
- Prisma + PostgreSQL for persistence
- EJS demo page (views/index.ejs)

## ⚙️ Prerequisites
- Node.js >= 18, npm
- PostgreSQL running and reachable via DATABASE_URL
- Redis running (defaults: localhost:6379)

## 🔧 Setup
1) Install dependencies
```bash
npm install
```

2) Configure environment (.env)
```bash
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dbname"
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password   # optional
```

3) Apply migrations and generate client
```bash
npx prisma migrate deploy
npx prisma generate
```

## ▶️ Run
- API server: `npm run api`
- Worker: `npm run worker`
- Both: `npm run dev`

Visit http://localhost:3000 to open the demo UI.

## 🌐 API
- POST /api/code-sessions → create a session. Response: { session_id, status }
- POST /api/code-sessions/:sessionId/run
  - Body: { code: string, language: "javascript" | "python" }
  - Limits: max 10,000 characters; only the above languages.
  - Response: { execution_id, status: "QUEUED" }
- GET /api/executions/:executionId → returns execution record with status/stdout/stderr.

## 🛠 Worker behavior
- Queue name: code-execution
- Status lifecycle: QUEUED → RUNNING → COMPLETED or FAILED or TIMEOUT (5s guard)
- Non-zero exit code marks FAILED; stderr is preserved. Temp file is cleaned after run.

## 🧭 Design notes (mini DESIGN.md)
- Architecture: API enqueues work; Worker pulls jobs and runs code; DB stores sessions/executions; Redis backs BullMQ. Components are decoupled via the queue.
- Reliability: execution state is persisted (QUEUED/RUNNING/COMPLETED/FAILED/TIMEOUT); worker uses a 5s timeout; graceful shutdown closes HTTP server, Prisma, Redis, and worker to reduce orphaned connections.
- Data model: CodeSession (id, status, timestamps) has many Executions (id, sessionId, code, language, status, stdout, stderr, executionTime, createdAt). See prisma/schema.prisma.
- Scalability: add more workers to scale execution throughput; Redis is the single queue; API is stateless and can be horizontally scaled. Postgres indexes on ids (default) handle lookups by executionId/sessionId.
- Trade-offs: no true sandbox (unsafe for untrusted code); timeout-based guard only; Redis/Postgres are single points unless clustered; code size capped at 10k chars to bound payload/IO.

## 🚧 Notes for interns
- This is not a security sandbox; do not run untrusted code in production.
- Configuration now comes from env; adjust PORT/Redis/Postgres there.
- Keep code changes small and validated; consider adding lint/tests if extending further.
