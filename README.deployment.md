# Deployment Guide

This guide covers deploying **Research Connect** to production:

| Service      | Platform    | Directory        |
|--------------|-------------|------------------|
| Frontend     | Vercel      | `frontend/`      |
| Backend API  | Railway     | `backend/`       |
| AI Service   | Railway     | `ai-service/`    |

---

## Prerequisites

- [Vercel](https://vercel.com) account (GitHub login)
- [Railway](https://railway.com) account (GitHub login)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- [Redis](https://upstash.com) instance (Upstash free tier works)
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (optional, for file uploads)
- [Google Gemini API key](https://aistudio.google.com/apikey) (optional, for AI features)
- Git repository pushed to GitHub

---

## 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Create a cluster (free M0 tier is fine)
2. Under **Security** → **Database Access**, create a database user (username + password)
3. Under **Security** → **Network Access**, add `0.0.0.0/0` (allow all) for `NODE_ENV=production` — or restrict to Railway's IPs
4. Click **Connect** → **Drivers** → copy the connection string, e.g.:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/research_connect?retryWrites=true&w=majority
   ```

---

## 2. Redis Setup (Upstash)

1. Go to [Upstash](https://upstash.com) → Create a Redis database (free tier)
2. Copy the **UPSTASH_REDIS_REST_URL** (e.g. `redis://default:...`)

---

## 3. Backend — Deploy to Railway

### 3.1 Create a Railway Project

1. Log in to [Railway](https://railway.com) and click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository
4. Railway will detect the root directory — **do not deploy from root yet**

### 3.2 Add Backend as a Service

1. Inside your Railway project, click **New** → **Service** → **Add from GitHub**
2. Select your repository
3. Set the **Root Directory** to `backend` (important — this tells Railway to use the `backend/` folder as the service root)
4. Railway will auto-detect the Dockerfile and build

### 3.3 Set Backend Environment Variables

In the Railway dashboard for your backend service, go to **Variables** and add:

| Variable               | Description                | Example Value |
|------------------------|----------------------------|---------------|
| `NODE_ENV`             | Environment mode           | `production`  |
| `PORT`                 | (Set automatically)        | `5000`        |
| `MONGO_URI`            | MongoDB connection string  | `mongodb+srv://...` |
| `JWT_SECRET`           | JWT signing secret         | `your-random-secret` |
| `JWT_REFRESH_SECRET`   | JWT refresh secret         | `your-random-refresh-secret` |
| `CLIENT_URL`           | Frontend URL (from Vercel) | `https://your-app.vercel.app` |
| `SERVER_URL`           | Backend URL (from Railway) | `https://your-backend.railway.app` |
| `REDIS_URL`            | Upstash Redis URL          | `redis://default:...` |
| `R2_ACCOUNT_ID`        | Cloudflare R2 account ID   | *(optional)* |
| `R2_ACCESS_KEY_ID`     | Cloudflare R2 access key   | *(optional)* |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key   | *(optional)* |
| `R2_BUCKET_NAME`       | R2 bucket name             | `research-connect` |
| `R2_PUBLIC_URL`        | R2 public endpoint URL     | *(optional)* |
| `SERP_API_KEY`         | SerpAPI key                | *(optional)* |
| `EMAIL_USER`           | SMTP email user            | *(optional)* |
| `EMAIL_PASS`           | SMTP email password        | *(optional)* |
| `RESEND_API_KEY`       | Resend API key             | *(optional)* |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | *(optional)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | *(optional)* |
| `GEMINI_API_KEY`       | Google Gemini API key      | *(optional)* |

> **Important**: Railway automatically provides `PORT`. The backend reads `process.env.PORT || 5000` so it handles either case.

### 3.4 Deploy

Railway will build and deploy automatically. Once complete, note your backend URL — it looks like:

```
https://backend-xxxxxxxx.up.railway.app
```

Verify the health endpoint:

```
https://backend-xxxxxxxx.up.railway.app/health
```

Expected response: `{ "status": "ok", "timestamp": "..." }`

---

## 4. AI Service — Deploy to Railway

> This service is optional. The backend works without it — AI features (summarization, recommendations, semantic search) fall back to heuristic-based logic when `GEMINI_API_KEY` is not set.

### 4.1 Add AI Service

1. In the same Railway project, click **New** → **Service** → **Add from GitHub**
2. Select your repository
3. Set the **Root Directory** to `ai-service`
4. Railway will auto-detect the Dockerfile and build

### 4.2 Set AI Service Variables

| Variable          | Description           | Required |
|-------------------|-----------------------|----------|
| `GEMINI_API_KEY`  | Google Gemini API key | Optional — AI features fall back gracefully |

### 4.3 Deploy

Railway will build and deploy. Your AI service URL looks like:

```
https://ai-service-xxxxxxxx.up.railway.app
```

Verify:

```
https://ai-service-xxxxxxxx.up.railway.app/health
```

Expected: `{"status":"healthy","gemini_enabled":true}`

> **Note**: The backend does NOT call the AI service directly in the current architecture — AI features are Python endpoints consumed by the frontend. If you want the backend to use the AI service, set `AI_SERVICE_URL` on the backend.

---

## 5. Frontend — Deploy to Vercel

### 5.1 Import Project

1. Go to [Vercel](https://vercel.com) and click **Add New** → **Project**
2. Import your GitHub repository
3. Set the **Root Directory** to `frontend` (Vercel will auto-detect Vite once you do this)
4. The `vercel.json` in `frontend/` handles SPA routing and caching

### 5.2 Set Frontend Environment Variables

| Variable             | Description                                    | Example Value                                    |
|----------------------|------------------------------------------------|--------------------------------------------------|
| `VITE_API_URL`       | Base URL for the Railway backend API           | `https://backend-xxxxxxxx.up.railway.app/api/v1` |

This tells the frontend Axios client to point all API calls to your Railway backend.

### 5.3 Configure Custom Domain (optional)

In Vercel dashboard → your project → **Domains**:
- Add your custom domain
- Vercel provisions an SSL certificate automatically

### 5.4 Deploy

Click **Deploy**. Vercel builds with `vite build` and deploys the `dist/` folder.

Your frontend URL looks like:

```
https://your-app.vercel.app
```

---

## 6. Environment Variables Reference

### Backend (Railway)

| Variable              | Required | Description                                     |
|-----------------------|----------|-------------------------------------------------|
| `NODE_ENV`            | Yes      | Set to `production`                             |
| `MONGO_URI`           | Yes      | MongoDB Atlas connection string                 |
| `JWT_SECRET`          | Yes      | Random 64-character secret for JWT signing      |
| `JWT_REFRESH_SECRET`  | Yes      | Different random secret for refresh tokens      |
| `CLIENT_URL`          | Yes      | Frontend domain (for CORS)                      |
| `REDIS_URL`           | No*      | Required if using real-time features / queues   |
| `SERVER_URL`          | No       | Backend public URL                               |
| `R2_ACCOUNT_ID`       | No       | Cloudflare R2 account ID                        |
| `R2_ACCESS_KEY_ID`    | No       | Cloudflare R2 access key                        |
| `R2_SECRET_ACCESS_KEY`| No       | Cloudflare R2 secret key                        |
| `R2_BUCKET_NAME`      | No       | R2 bucket name                                  |
| `SERP_API_KEY`        | No       | Google Scholar API key                          |
| `EMAIL_USER`          | No       | SMTP username for email sending                 |
| `EMAIL_PASS`          | No       | SMTP password                                   |
| `GEMINI_API_KEY`      | No       | Google Gemini API key                           |
| `LOG_LEVEL`           | No       | Winston log level (`info`, `debug`, `error`)    |

\* Redis is optional in production; the server logs a warning and continues in fallback mode.

### Frontend (Vercel)

| Variable        | Required | Description                                  |
|-----------------|----------|----------------------------------------------|
| `VITE_API_URL`  | Yes      | Railway backend URL + `/api/v1` prefix       |

### AI Service (Railway)

| Variable        | Required | Description                |
|-----------------|----------|----------------------------|
| `GEMINI_API_KEY`| No       | Powers summarization & search |

---

## 7. Post-Deployment Checklist

- [ ] **Health Check**: `GET /health` on backend returns `200 OK`
- [ ] **CORS**: Frontend can make API calls to backend without CORS errors
- [ ] **Authentication**: Register a user, log in, verify JWT flow
- [ ] **Real-time**: Messages and notifications work via Socket.IO
- [ ] **File Upload**: Profile photos / publication PDFs upload to R2
- [ ] **AI Features**: Summarization and search endpoints respond
- [ ] **Redis**: Connected and caching works (check logs)
- [ ] **Custom Domain (optional)**: SSL certificate is active

### Troubleshooting

| Symptom                        | Likely Cause                                  | Fix                                               |
|--------------------------------|-----------------------------------------------|---------------------------------------------------|
| CORS errors on frontend        | `CLIENT_URL` not set or wrong on backend      | Set `CLIENT_URL` to exact Vercel domain           |
| Backend crashes on startup     | Missing required env vars                     | Check `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| Socket.IO connection fails     | WebSocket not configured in Railway           | Railway supports WebSocket by default             |
| AI endpoints return fallback   | `GEMINI_API_KEY` missing on AI service        | Add Gemini API key to AI service variables        |
| Build fails on Vercel          | Root directory not set to `frontend`          | In Vercel project settings, set Root Directory    |
| Redis connection error         | `REDIS_URL` incorrect or Redis not accessible | Verify Upstash URL and network access             |

---

## 8. Architecture Overview

```
                               ┌─────────────────────┐
                               │    Vercel (CDN)      │
                               │  Frontend (React)    │
                               │  research-connect.   │
                               │  vercel.app          │
                               └──────────┬──────────┘
                                          │ HTTPS
                                          │ /api/v1/*
                                          ▼
                               ┌─────────────────────┐
                               │  Railway (Backend)   │
                               │  Express + Socket.IO │
                               │  :5000               │
                               └──┬──────┬───────────┘
                                  │      │
                                  ▼      ▼
                          ┌─────────┐ ┌──────┐
                          │ MongoDB │ │Redis │
                          │(Atlas)  │ │(Upstash)
                          └─────────┘ └──────┘

 ┌─────────────────────┐
 │ Railway (AI Service) │
 │ Python / FastAPI     │
 │ :8000                │
 └─────────────────────┘
```

---

## 9. Railway Quick Deploy (CLI)

Alternatively, deploy via Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# From the project root, link to your Railway project
railway link

# Deploy backend
railway up --service backend --root backend

# Deploy ai-service
railway up --service ai-service --root ai-service
```

## 10. Updating

Push to your GitHub repository's main branch. Both Vercel and Railway auto-deploy on push. To disable auto-deploy for a service, toggle it in the dashboard.
