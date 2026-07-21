---
name: research-connect-enterprise-dev
description: Guidelines, design patterns, security rules, and architectural standards for the Research Connect workspace.
---

# Research Connect Enterprise Development & Architectural Standards

This skill provides comprehensive instructions, design patterns, and constraints for full-stack engineering, database management, DevOps, security engineering, and AI tool integrations on the **Research Connect** platform.

---

## 🏛️ 1. Backend Clean Architecture
We adhere to a strict **Feature-First Architecture** with a clear separation of concerns:
- **Routes Layer**: Exposes versioned endpoints under `/api/v1/` and manages routing middlewares (authentication, validation, rate limiting).
- **Controller Layer**: Handles API requests, coordinates input validation, extracts request context, and returns standard JSON responses. Component layout and database logic must NEVER reside here.
- **Service Layer**: House of all business logic, transactions, cache management, socket emissions, and third-party integrations.
- **Repository Layer**: Manages all raw database access. All repositories inherit from a base class supporting standardized CRUD (create, find, update, delete, pagination, soft-deletes).

### Winston Logging Standard
Always output structured JSON logs categorized by domains:
```javascript
const logger = require('../common/logger');
logger.info('User successfully authenticated', { userId, domain: 'auth' });
logger.error('Database query timed out', { error: err.message, domain: 'database' });
```

---

## 💻 2. Frontend Design & Component Rules
- **Component File Limits**: Keep files modular and clean. No React component file should exceed **300 lines**.
- **Aesthetic Excellence**: Focus on premium, state-of-the-art designs with curated color palettes (e.g., custom HSL colors, sleek dark modes), Google Fonts, smooth gradients, and subtle micro-animations using Framer Motion and GSAP.
- **State & Data Fetching**: Use **Redux Toolkit** for client state, **React Query** for async server caching, and **Axios** for API requests.
- **Common Elements**: Always reuse core custom components (Navbar, Sidebar, Modal, Card, Button, Input, Select, Checkbox, Pagination, Skeleton).

---

## ⚙️ 3. Database Modeling & Optimizations
- **Schema Design**: Every schema must declare `{ timestamps: true }`, index references, and soft-delete fields (`isDeleted`, `deletedAt`, `deletedBy`).
- **Compound Indexes**: Declare compound indexes to support high-performance filtered lists (e.g., `{ userId: 1, isDeleted: 1, status: 1 }`).
- **Aggregation Pipelines**: Use aggregate pipelines only inside repositories. Avoid returning unmapped fields; always apply `$project` or `$addFields`.
- **Offline Cache**: Cache heavy dashboard views or profile summaries in **Redis** with short lifetimes (30s to 5 mins) to prevent Atlas connection saturation.

---

## 🔒 4. Defensive Security Best Practices
- **Middleware Protections**:
  - **Helmet**: Inject headers to protect against clickjacking, sniff attacks, and frame injection.
  - **Sanitization**: Protect against MongoDB Operator Injection by sanitizing inputs using `mongo-sanitize`.
  - **XSS Clean**: Clean input fields to strip dangerous HTML and JS tags.
  - **Rate Limiting**: Enforce global and route-specific limits, and configure `passOnStoreError: true` to fail-open if the cache server disconnects.
- **Access Control**: Validate JWT tokens on every authenticated route. Use Role-Based Access Control (RBAC) to enforce strict ownership checks before permitting mutations.

---

## 🚀 5. DevOps & Observability
- **Storage Strategy**: Cloudflare R2 is the single repository source for files and attachments.
- **Error Tracking**: Instrument Sentry on both frontend and backend to collect performance traces and crash events. Separate tracking by environments (`development`, `staging`, `production`).
- **Health Dashboards**: Log performance metrics, server load, and DB connections to Datadog for alerting.

---

## 🤖 6. AI Agent Workflows & Integrations
- **Google Scholar Syncing**: Run background import tasks using queues with backoff logic to fetch publication lists without exceeding SerpAPI quotas.
- **Recommendation Systems**: Score research areas and keywords to suggest related articles to users. Invalidate feed caches when a user publishes new research.
