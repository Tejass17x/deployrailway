# Research Connect — Folder Structure Guide

This document describes the complete workspace folder structure for **Research Connect** to guide engineers during development. It details the modular separation of concerns on both the client (React Vite) and the server (Node.js Express).

---

## 🏛️ Project Root Structure
```text
ResearchConnect/
├── backend/            # Express.js Node API (Backend Application)
├── frontend/           # React SPA powered by Vite (Frontend Application)
├── docs/               # Technical Guides and Architectural Specs
├── .agents/            # Workspace local rules (AGENTS.md)
├── database_schema.md  # Database collection definitions
├── LICENSE             # Project LICENSE
├── README.md           # Getting started overview
└── .gitignore          # Version control ignore lists
```

---

## 💻 Backend Folder Layout (`backend/src/`)
The backend follows a strict **Feature-First Architecture** inside the `modules` directory, complemented by global database schemas and common abstractions.

```text
backend/src/
├── config/             # Modular system configurations
│   ├── database/       # Mongoose connections, indexes, and seeders
│   ├── app.js          # Express server configurations
│   ├── cors.js         # CORS headers configuration
│   ├── environment.js  # Environment variables validation & mapping
│   ├── logger.js       # Winston config
│   ├── mongodb.js      # DB connection details config
│   ├── rateLimiter.js  # API request limits mapping (auth limits, sync limits)
│   └── server.js       # Server port constants
├── common/             # Reusable base logic and utilities
│   ├── errors/         # Custom operational Error classes (AppError)
│   ├── logger/         # Winston Categorical File Loggers
│   ├── middlewares/    # RequestId, logging, security, validation, error handlers
│   ├── repository/     # BaseRepository CRUD class
│   ├── responses/      # Standardized API response formatter (ApiResponse)
│   ├── service/        # BaseService CRUD logic class
│   └── utils/          # Token, hash, encryption, and email (Nodemailer) helpers
├── models/             # Mongoose schemas (83 model files)
├── socket/             # Socket.IO real-time infrastructure
│   ├── gateway/        # Socket event gateway and main handler
│   ├── middleware/     # Socket authentication (JWT verification for sockets)
│   ├── presence/       # Online/offline user presence tracking
│   ├── rooms/          # Conversation room join/leave management
│   └── sessions/       # Socket session state tracking per user
├── modules/            # Domain Feature Modules (22 active isolated directories)
│   ├── landing/        # Landing page API endpoints
│   ├── authentication/ # Authentication, OTP verification, and RTR token session module
│   ├── profile/        # Researcher profile updates & user synchronization
│   ├── scholar/        # Google Scholar SerpAPI import background job workers
│   ├── feed/           # Feed feeds, publication CRUD, comments, follows, bookmarks
│   └── help/           # Help Center (Support, Grievance, and Feedback submissions)
│       ├── controller/ # Controllers mapping route triggers
│       ├── service/    # Business services and validation hooks
│       ├── repository/ # Database access queries extending BaseRepository
│       ├── routes/     # Express route definitions
│       ├── validator/  # Express-validator schema rules
│       ├── middleware/ # Module specific middlewares
│       └── dto/        # Data Transfer Object structures
├── app.js              # Express app setup and middleware routing
├── server.js           # Server port listener and graceful shutdowns
└── index.js            # Startup script
```

### Module File Responsibilities (Backend):
- **controller/**: Receives request, validates params, calls services, sends standard `ApiResponse`.
- **service/**: Holds business rules, coordinates repositories, parses logic.
- **repository/**: Handles database Mongoose queries, inherits from `BaseRepository`.
- **routes/**: Mounts route URLs to specific controllers and middlewares.
- **validator/**: Reusable express-validator chains mapping payload validation rules.
- **dto/**: Formats response data objects before sending back to client.

---

## 🎨 Frontend Folder Layout (`frontend/src/`)
The React SPA follows a modular structure grouped by functionalities, redux state slices, and UI controls:

```text
frontend/src/
├── api/                # Axios instances and interceptor logic
├── assets/             # Static images, local SVGs, and assets
├── animations/         # Framer-motion layout transitions
├── components/         # Shared React components
│   └── common/         # Atomic UI design system components
│       ├── buttons/    # Reusable Buttons with spinners
│       ├── cards/      # Glassmorphic and simple Cards
│       ├── forms/      # Form wrappers
│       ├── inputs/     # Inputs, selects, and checkboxes
│       ├── tables/     # Datatable layout and pagination selectors
│       ├── modals/     # Modal drawers with backdrop locks
│       └── loaders/    # Spinners and content Skeleton placeholders
├── layouts/            # Page shell frames
│   ├── Navbar/         # Header brand bar
│   ├── Sidebar/        # Admin/Researcher left navigation drawer
│   ├── Footer/         # Page base links
│   ├── DashboardLayout/# Shell for internal pages
│   ├── AuthLayout/     # Shell for login / register pages
│   └── LandingLayout/  # Shell for website landing page
├── modules/            # Feature-First Modules
│   ├── landing/        # Landing page components, styles, and subviews
│   ├── auth/           # Authentication views (Login, Register, OTP, Reset)
│   ├── dashboard/      # Researcher Dashboard view & statistics graphs
│   ├── profile/        # Profile Affiliation editor & publications list
│   ├── feed/           # Social media feed, bookmarks, and paper list
│   └── project/        # Collaboration space projects
├── redux/              # Redux Toolkit global store and slices
│   ├── slices/
│   │   ├── appSlice.js          # Navigation, menus, & loading
│   │   ├── authSlice.js         # JWT token caches & verification status
│   │   ├── loadingSlice.js      # Global loading overlay spinner state
│   │   ├── notificationSlice.js # Global system notification queue
│   │   ├── sessionSlice.js      # Device sessions
│   │   ├── themeSlice.js        # Theme toggles and cache (light/dark/system)
│   │   └── userSlice.js         # User metadata
│   └── index.js                 # Redux store combinator
├── services/           # Async API client calls
│   ├── auth.service.js   # Client actions for login, register, OTP
│   ├── profile.service.js# Client actions for profile and scholar sync
│   └── help.service.js   # Client actions for Help Center tickets & info
├── constants/          # Static lists, select options, and error messages
├── routes/             # React Router DOM configuration
│   ├── AppRoutes.jsx     # Main routes configuration mapping elements
│   ├── ProtectedRoute.jsx# Auth guard for account pages
│   └── PublicRoute.jsx   # Auth guard preventing login view for active users
├── utils/              # Client-side formatting and validations
├── styles/             # Global CSS and Tailwind configurations
├── App.jsx             # Main router mount point
└── main.jsx            # Index mount point registering Redux & React Query
```

### Module File Responsibilities (Frontend):
- **components/**: Independent reusable layout parts.
- **layouts/**: Page structural outlines wrapping pages.
- **modules/<name>/pages/**: Direct page views mounted to routes.
- **redux/**: Global client states.
- **services/**: Direct api calls requesting backend endpoints.
