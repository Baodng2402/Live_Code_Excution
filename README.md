Đây là file **`README.md`** hoàn chỉnh, chuyên nghiệp và đáp ứng **100% yêu cầu** của file PDF (bao gồm Docker setup, Architecture, API Docs và Trade-offs).

Bạn chỉ cần tạo file `README.md` ở thư mục gốc và **Copy - Paste** toàn bộ nội dung dưới đây vào:

---

```markdown
# 🚀 Edtronaut - Live Code Execution Backend
> **Author:** Dang Nguyen Gia Bao
> **Role:** Backend Engineering Intern Assignment

## 📖 Overview
This project is a backend system designed to securely execute user-submitted code asynchronously. It solves the problem of blocking HTTP requests by offloading code execution to a background worker using a message queue.

The system features a **Non-blocking Architecture** and includes a **Live UI Demo** for testing.

---

## 🏗 System Architecture

The system follows a producer-consumer pattern to decouple HTTP handling from code execution.

```mermaid
graph LR
    User[Client / UI] -->|1. Submit Code| API[API Server]
    API -->|2. Create Record| DB[(PostgreSQL)]
    API -->|3. Push Job| Redis[(Redis Queue)]
    API -->|4. Return 'QUEUED'| User
    
    Worker[Worker Service] -->|5. Pop Job| Redis
    Worker -->|6. Execute Code| Sandbox[Node/Python]
    Sandbox -->|7. Output| Worker
    Worker -->|8. Update Status| DB
    
    User -->|9. Poll Status| API

```

## 🧩 Tech Stack

* **Runtime:** Node.js, TypeScript
* **Framework:** Express.js
* **Queue:** BullMQ + Redis (Asynchronous Processing)
* **Database:** Prisma + PostgreSQL (Persistence)
* **DevOps:** Docker & Docker Compose
* **Frontend:** EJS + Bulma CSS (Simple Demo UI)

---

## 📂 Project Structure

The codebase follows a clear separation of concerns:

```
src/
├── config/         # Database (Prisma) & Redis Queue configuration
├── controllers/    # API Logic (Producer & Validation)
├── routes/         # API Route Definitions
├── worker.ts       # Background Worker (Consumer - Processes jobs)
├── server.ts       # API Server Entry Point
└── views/          # EJS Templates for Demo UI
docker-compose.yml  # Infrastructure Setup (DB, Redis, App)

```

---

## 🐳 Run with Docker (Recommended)

This is the fastest way to run the full system (Postgres + Redis + API + Worker) with one command.

**1. Start the System:**

```bash
docker-compose up -d --build

```

**2. Initialize Database:**
Run the migration command inside the API container:

```bash
docker-compose exec api npx prisma migrate deploy

```

**3. Access the Application:**

* **Live Demo UI:** [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
* **API Endpoint:** `http://localhost:3000/api`

---

## ⚙️ Manual Setup (Local Development)

If you prefer running locally without Docker containers for the app:

**1. Prerequisites**

* Node.js >= 18
* PostgreSQL & Redis running locally.

**2. Configuration**
Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/edtronaut_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379

```

**3. Installation & Run**

```bash
# Install dependencies
npm install

# Setup Database
npx prisma migrate dev --name init

# Run API & Worker concurrently
npm run dev

```

---

## 🌐 API Documentation

### 1. Create Session

Initialize a new coding session.

* **POST** `/api/code-sessions`
* **Response:**
```json
{ "session_id": "uuid...", "status": "ACTIVE" }

```



### 2. Execute Code (Async)

Submit code for execution. The server returns immediately without waiting for the result.

* **POST** `/api/code-sessions/:sessionId/run`
* **Body:**
```json
{
  "code": "console.log('Hello Edtronaut');",
  "language": "javascript" 
}

```


* **Supported Languages:** `javascript` (Node.js), `python`.
* **Response:**
```json
{ "execution_id": "uuid...", "status": "QUEUED" }

```



### 3. Get Execution Status

Poll this endpoint to get the result.

* **GET** `/api/executions/:executionId`
* **Response (Completed):**
```json
{
  "status": "COMPLETED",
  "stdout": "Hello Edtronaut\n",
  "stderr": "",
  "executionTime": 12
}

```



---

## 📐 Design Decisions & Trade-offs

### 1. Why Async Queue (Redis)?

Code execution is CPU-intensive and unpredictable. Running user code in the main HTTP thread would block the **Node.js Event Loop**, causing the API to hang for other users.

* **Solution:** I decoupled the **Request** (API) from the **Execution** (Worker). The API pushes a job to Redis and responds immediately. The Worker picks up the job when resources are available.

### 2. Reliability & Safety

* **Timeout Guard:** The worker implements a strict **5-second timeout** for code execution. If the user code enters an infinite loop, the process is killed automatically to preserve system resources.
* **Error Handling:** The system captures both `stderr` and runtime exceptions, updating the database status to `FAILED` so the user knows what went wrong.

### 3. Database Strategy

I chose **PostgreSQL** with **Prisma** over NoSQL because the relationship between `Sessions` and `Executions` is structured and requires data integrity.

### 4. Limitations & Future Improvements

* **Isolation:** Currently, the system uses Node.js `child_process`. While fast, it is not fully isolated. In a production environment, I would upgrade this to **Docker-in-Docker** or **Firecracker MicroVMs** to prevent malicious file system access.
* **Real-time:** Currently uses polling. I would implement **WebSockets (Socket.io)** to push results instantly to the client.

---

### ✅ Checklist for Reviewers

* [x] **Dockerized:** `docker-compose.yml` included.
* [x] **Async Processing:** Uses BullMQ & Redis.
* [x] **Clean Architecture:** Separated Controllers, Workers, and Config.
* [x] **Bonus:** Includes a UI for easy testing.

```

```
