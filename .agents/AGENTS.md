# Research Connect Global Development Rules & Coding Standards

This document defines the permanent, project-scoped rules, coding standards, and architectural constraints for **Research Connect**. Every future coding task, file edit, or module creation must strictly comply with these rules.

---

## 🏛️ Project Goal & Philosophy
- **Enterprise-Grade**: Research Connect is an AI-powered Research Discovery & Collaboration Platform designed to scale to millions of users.
- **Robust & Clean**: No quick fixes, temporary code, hardcoded values, or duplicated logic.
- **Strict Separation of Concerns**: 
  - Never place business logic inside React Components or Express Routes.
  - Never directly access MongoDB from Controllers.

---

## 🏛️ Architecture & Folder Structure
We enforce a strict **Feature-First Architecture** combining MVC, Repository Pattern, Service Layer, and DTO Pattern.

### Module isolation
Each module must be completely independent and plug-and-play. Every module folder must follow this sub-structure:
```text
module/
├── controller/
├── service/
├── repository/
├── routes/
├── validator/
├── middleware/
├── dto/
└── helper/
```

### API Routing & Standard
- All endpoints must be versioned under `/api/v1/` (e.g., `/api/v1/auth`, `/api/v1/profile`).
- Every response must adhere to the standardized formats:
  - **Success**:
    ```json
    {
      "success": true,
      "message": "Description",
      "data": {},
      "error": null
    }
    ```
  - **Failure**:
    ```json
    {
      "success": false,
      "message": "Error description",
      "error": {}
    }
    ```

---

## 💻 Frontend Coding Standards
- **Stack**: React.js, JavaScript, Vite, Tailwind CSS, Redux Toolkit, React Router DOM, React Query, Axios, Framer Motion, and React Hook Form.
- **Component Rules**:
  - Keep components small and reusable. No component file should exceed approximately **300 lines**.
  - Separate UI layouts, business logic, API calls, validators, custom hooks, and constants.
  - Implement lazy loading, Suspense, and Error Boundaries for all module routing gates.
  - Utilize reusable common components: Navbar, Sidebar, Footer, Modal, Card, Button, Input, Select, Checkbox, Table, Pagination, Loader, Skeleton, Toast, Avatar, Badge.

---

## ⚙️ Backend & Database Coding Standards
- **Stack**: Node.js, Express.js, MongoDB, Mongoose.
- **Database Rules**:
  - Every schema must support `timestamps: true` (`createdAt` and `updatedAt`).
  - Implement index definitions, soft delete fields, and auditing fields on all collections.
  - Relationships must be normalized using `ObjectId` references. Never duplicate data unnecessarily.
- **Generic CRUD Engine**:
  - All future repository classes must inherit from the base CRUD repository class supporting: `create`, `createMany`, `find`, `findOne`, `findById`, `update`, `updateMany`, `delete`, `softDelete`, `restore`, `aggregate`, `paginate`, `bulkInsert`, `bulkUpdate`, `search`.

---

## 🔒 Security & Logging Rules
- **Security**: Stack Helmet, Rate Limiter, Compression, Mongo Sanitization, XSS Protection, CSRF readiness, secure cookies, and password hashing (bcryptjs).
- **Secrets**: Never expose credentials or JWT keys; read them from `.env` configurations.
- **Winston Logs**: Output structured JSON logs separated by: Application, Database, API, Error, and Authentication.
