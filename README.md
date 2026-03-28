# TaskFlow API 🚀

A production-ready REST API built with Node.js + Express + MongoDB — designed for learning and practicing a complete DevOps workflow including Docker, CI/CD, and Kubernetes.

---

## 📁 Project Structure

```
taskflow-api/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection & events
│   │   └── env.js            # Centralized environment config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication & role authorization
│   │   ├── errorHandler.js   # Centralized error handling + AppError class
│   │   ├── requestLogger.js  # Morgan → Winston HTTP logging
│   │   └── validate.js       # express-validator middleware
│   ├── models/
│   │   ├── Task.js           # Task schema (CRUD target)
│   │   └── User.js           # User schema with bcrypt password hashing
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth
│   │   ├── healthRoutes.js   # /health (liveness, readiness, info)
│   │   ├── taskRoutes.js     # /api/tasks
│   │   └── userRoutes.js     # /api/users
│   ├── services/
│   │   ├── authService.js    # Register, login, JWT generation
│   │   ├── taskService.js    # Task business logic & queries
│   │   └── userService.js    # User business logic
│   ├── utils/
│   │   ├── apiResponse.js    # Standardized response helper
│   │   └── logger.js         # Winston logger (file + console)
│   ├── app.js                # Express app setup (middleware, routes)
│   └── server.js             # Entry point — DB connect + graceful shutdown
├── tests/
│   ├── unit/
│   │   ├── apiResponse.test.js
│   │   └── errorHandler.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── tasks.test.js
│       └── health.test.js
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── mongo-deployment.yaml
│   ├── deployment.yaml       # App Deployment + liveness/readiness probes + HPA
│   └── service.yaml          # Service + Ingress + HorizontalPodAutoscaler
├── scripts/
│   └── mongo-init.js         # MongoDB init script (indexes, collections)
├── .github/workflows/
│   └── ci-cd.yml             # GitHub Actions: lint → test → build → deploy
├── .gitlab-ci.yml            # GitLab CI alternative
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # App + MongoDB + Mongo Express
├── docker-compose.dev.yml    # Dev override (hot reload)
├── .env.example
└── README.md
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB 6+ running locally **or** use Docker Compose

### 1. Clone & install

```bash
git clone https://github.com/your-username/taskflow-api.git
cd taskflow-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set MONGODB_URI to your local MongoDB
```

### 3. Run in development

```bash
npm run dev
# Server starts at http://localhost:3000
```

### 4. Run tests

```bash
npm test                  # Run all tests with coverage
npm test -- --watch       # Watch mode
```

### 5. Lint

```bash
npm run lint              # Check
npm run lint:fix          # Auto-fix
```

---

## 🐳 Docker

### Run with Docker Compose (recommended)

```bash
# Build and start everything (app + MongoDB + Mongo Express)
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop and delete volumes (wipes DB data)
docker compose down -v
```

Services started:
| Service       | URL                          | Notes                    |
|---------------|------------------------------|--------------------------|
| TaskFlow API  | http://localhost:3000        | REST API                 |
| Mongo Express | http://localhost:8081        | DB UI (admin/admin123)   |
| MongoDB       | localhost:27017              | Direct connection        |

### Run in development mode (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Build the Docker image manually

```bash
# Build production image
docker build --target production -t taskflow-api:latest .

# Run standalone (requires external MongoDB)
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/taskflow \
  -e JWT_SECRET=your-secret \
  taskflow-api:latest
```

---

## 🌐 API Endpoints

### Base URL: `http://localhost:3000`

### Health
| Method | Endpoint         | Auth | Description                        |
|--------|------------------|------|------------------------------------|
| GET    | `/health`        | ❌   | Basic health check                 |
| GET    | `/health/ready`  | ❌   | Readiness (DB connectivity)        |
| GET    | `/health/live`   | ❌   | Liveness check                     |
| GET    | `/health/info`   | ❌   | System info (node, memory, uptime) |

### Auth
| Method | Endpoint            | Auth | Description             |
|--------|---------------------|------|-------------------------|
| POST   | `/api/auth/register`| ❌   | Register a new user     |
| POST   | `/api/auth/login`   | ❌   | Login and get JWT token |
| GET    | `/api/auth/me`      | ✅   | Get current user        |

### Tasks (all require auth)
| Method | Endpoint             | Auth | Description                              |
|--------|----------------------|------|------------------------------------------|
| GET    | `/api/tasks`         | ✅   | List tasks (paginated, filtered, sorted) |
| GET    | `/api/tasks/stats`   | ✅   | Task counts by status                    |
| GET    | `/api/tasks/:id`     | ✅   | Get single task                          |
| POST   | `/api/tasks`         | ✅   | Create task                              |
| PUT    | `/api/tasks/:id`     | ✅   | Full update                              |
| PATCH  | `/api/tasks/:id`     | ✅   | Partial update (e.g., status only)       |
| DELETE | `/api/tasks/:id`     | ✅   | Delete task                              |

**Query parameters for GET /api/tasks:**

| Param    | Values                         | Example              |
|----------|--------------------------------|----------------------|
| page     | integer (default: 1)           | `?page=2`            |
| limit    | 1–100 (default: 10)            | `?limit=5`           |
| status   | `todo`, `in-progress`, `done`  | `?status=todo`       |
| priority | `low`, `medium`, `high`        | `?priority=high`     |
| search   | string                         | `?search=deploy`     |
| sort     | field name (default: createdAt)| `?sort=dueDate`      |
| order    | `asc`, `desc`                  | `?order=asc`         |

### Users (admin only unless own profile)
| Method | Endpoint             | Auth       | Description             |
|--------|----------------------|------------|-------------------------|
| GET    | `/api/users/profile` | ✅ Any      | Get own profile         |
| GET    | `/api/users`         | ✅ Admin    | List all users          |
| GET    | `/api/users/:id`     | ✅ Admin    | Get user by ID          |
| PUT    | `/api/users/:id`     | ✅ Own/Admin| Update user             |
| DELETE | `/api/users/:id`     | ✅ Admin    | Deactivate user         |

---

## 📡 Example API Calls

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Create task (replace TOKEN with JWT from login)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Deploy to Kubernetes","priority":"high","status":"todo"}'

# List tasks with filters
curl "http://localhost:3000/api/tasks?status=todo&priority=high&limit=5" \
  -H "Authorization: Bearer TOKEN"

# Update task status
curl -X PATCH http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status":"in-progress"}'

# Task stats
curl http://localhost:3000/api/tasks/stats \
  -H "Authorization: Bearer TOKEN"
```

---

## ☸️ Kubernetes Deployment

### Prerequisites
- kubectl configured for your cluster
- Docker image pushed to a registry

### 1. Update the image name

Edit `k8s/deployment.yaml` and replace:
```yaml
image: your-dockerhub-username/taskflow-api:latest
```
with your actual image (e.g., `ghcr.io/your-org/taskflow-api:latest`).

### 2. Create the secret

```bash
kubectl create secret generic taskflow-secrets \
  --from-literal=JWT_SECRET=your-real-production-secret \
  --namespace=taskflow
```

### 3. Apply all manifests

```bash
# Apply in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 4. Verify deployment

```bash
# Watch pods come up
kubectl get pods -n taskflow -w

# Check deployment status
kubectl rollout status deployment/taskflow-app -n taskflow

# View logs
kubectl logs -f deployment/taskflow-app -n taskflow

# Port-forward for local testing
kubectl port-forward svc/taskflow-service 3000:80 -n taskflow
```

### 5. Rolling update (zero-downtime)

```bash
# Update image
kubectl set image deployment/taskflow-app \
  taskflow-app=your-image:new-tag \
  -n taskflow

# Monitor rollout
kubectl rollout status deployment/taskflow-app -n taskflow

# Rollback if needed
kubectl rollout undo deployment/taskflow-app -n taskflow
```

---

## 🔄 CI/CD (GitHub Actions)

The pipeline in `.github/workflows/ci-cd.yml` runs on every push:

```
Push to main
    │
    ├─ lint          ESLint code quality check
    │
    ├─ test          Jest tests with coverage report
    │
    ├─ security      npm audit (high severity)
    │
    ├─ build         Docker multi-platform build + push to GHCR
    │
    └─ deploy        kubectl rolling update to staging
```

**Required GitHub Secrets:**

| Secret       | Description                         |
|--------------|-------------------------------------|
| GITHUB_TOKEN | Auto-provided by GitHub Actions     |
| KUBE_CONFIG  | Base64-encoded kubeconfig (staging) |

---

## 📊 Response Format

All API responses follow this consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Paginated list:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔑 Key DevOps Concepts Demonstrated

| Concept              | Where                                                  |
|----------------------|--------------------------------------------------------|
| Multi-stage Docker   | `Dockerfile` (deps → builder → production)             |
| Health probes        | `/health/live`, `/health/ready` → K8s probes           |
| Graceful shutdown    | `server.js` → SIGTERM/SIGINT handling                  |
| Config externalized  | `.env` / K8s ConfigMap + Secrets                       |
| Non-root container   | `Dockerfile` → `adduser nodeapp`                       |
| Rolling updates      | `k8s/deployment.yaml` → RollingUpdate strategy         |
| Auto-scaling         | `k8s/service.yaml` → HorizontalPodAutoscaler           |
| Structured logging   | Winston → JSON logs → ready for ELK/Loki/CloudWatch    |
| CI/CD pipeline       | GitHub Actions → lint → test → build → deploy          |
| Secrets management   | K8s Secrets (never in ConfigMap or image)              |

---

## 🛠️ Development Tips

```bash
# Run only unit tests
npx jest tests/unit

# Run only integration tests
npx jest tests/integration

# Run specific test file
npx jest tests/integration/auth.test.js

# Generate test coverage report
npm test -- --coverage

# Debug mode (attach Node inspector)
node --inspect src/server.js
```
