# Research Connect — Coding Standards & Guidelines

This document outlines the coding standards, design patterns, and architectural constraints enforced across the **Research Connect** codebase.

---

## 🏛️ General Rules
- **No Quick Fixes**: Code must be production-ready. No hardcoded credentials, duplicate functions, or debug statements in committed files.
- **Strict Separation of Concerns**: 
  - Controllers only process inputs and route delegation.
  - Services contain all business logic.
  - Repositories handle MongoDB Mongoose interactions.
  - React Components only handle rendering and layout bindings.

---

## 💻 Backend Standards

### 1. Repository Extensibility
Every repository must extend the `BaseRepository` class to benefit from default CRUD engines.
```javascript
const BaseRepository = require('../../../common/repository/base.repository');
const MyModel = require('../../../models/MyModel');

class MyRepository extends BaseRepository {
  constructor() {
    super(MyModel);
  }
}
module.exports = new MyRepository();
```

### 2. Service Extensibility
Every service should inherit from `BaseService` to inherit standard pagination, error checking, and transactions.
```javascript
const { BaseService } = require('../../../common/service');
const myRepository = require('../repository/my-feature.repository');

class MyService extends BaseService {
  constructor() {
    super(myRepository);
  }
}
module.exports = new MyService();
```

### 3. Response Contracts
All API endpoints must return standardized JSON responses. Use `ApiResponse` methods inside controllers:
- **Success (200 / 201)**:
  ```json
  {
    "success": true,
    "message": "Resource fetched successfully",
    "data": { ... },
    "error": null
  }
  ```
- **Error (4xx / 5xx)**:
  ```json
  {
    "success": false,
    "message": "Error details summary",
    "error": {
      "code": "ERROR_CODE",
      "details": { ... }
    }
  }
  ```

### 4. Categorical Logging
Logs must be output using Winston's dedicated categories to keep files separated:
```javascript
const logger = require('../common/logger/winston');

logger.info("Application event");      // Goes to application.log
logger.db.info("Query executing");      // Goes to mongodb.log
logger.api.info("Request received");    // Goes to api.log
logger.auth.info("User logged in");     // Goes to auth.log
logger.error("System failure", error);  // Goes to error.log
```

### 5. Input Validation Pattern
We enforce strict schema validations on all routes using `express-validator`. Validation logic resides in the `validator/` subfolder of each module:
```javascript
// validator/my-feature.validator.js
const { body } = require('express-validator');
const validationMiddleware = require('../../../common/middlewares/validation.middleware');

exports.myDataValidator = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validationMiddleware
];
```

---

## 🎨 Frontend Standards

### 1. Styling Constraints
- Use **Tailwind CSS** classes. Do not write inline styles.
- Theme tokens like `primary`, `accent`, `bg-page`, `text-primary` are configured in `tailwind.config.js` and must be used for consistency.
- Maintain responsive layouts supporting mobile (320px) up to ultra-wide desktop displays (1920px+).

### 2. Reusable UI Elements
Never recreate buttons, inputs, tables, or modals from scratch. Always import from `components/common/...` to ensure accessibility and consistent design.

### 3. State Decoupling
- Cache backend API data via **React Query**.
- Use **Redux Toolkit** only for sync UI states (sidebar toggles, themes, notifications, global loading bars).

### 4. API Client & Interceptors
Always make API requests through the global `axiosInstance` helper (`frontend/src/api/axiosInstance.js`):
- **Authorization**: Attaches Bearer JWT token from Redux store automatically.
- **Refresh Token Rotation**: Detects expired access tokens (401), initiates a refresh request behind the scenes, and transparently retries the failed request.
- **Global Error Toasts**: Intercepts non-success states and alerts the user using the Redux notification system.
