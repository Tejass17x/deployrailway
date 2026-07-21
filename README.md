# Research Connect

An enterprise-grade, production-ready **AI-Powered Research Discovery & Collaboration Platform** built using the MERN Stack (React, Node.js, Express, MongoDB). Designed with a clean **Feature-First Architecture**, strict design systems, and modern SaaS aesthetics.

This documentation reflects all completed phases including the full messaging system, real-time Socket.IO infrastructure, notification center, researcher connections, collaboration workspaces, and research feed.

### 📖 Technical Documentation Guides

For in-depth explanations of specific features, refer to:

- [Architecture Guide](file:///c:/Users/codew/Downloads/Research.connect/docs/architecture_guide.md) — System layers, security mechanisms, and background jobs.
- [Folder Guide](file:///c:/Users/codew/Downloads/Research.connect/docs/folder_guide.md) — Codebase layouts and file conventions.
- [Coding Standards & Guidelines](file:///c:/Users/codew/Downloads/Research.connect/docs/coding_standards.md) — Coding conventions, repository, and service rules.
- [Installation Guide](file:///c:/Users/codew/Downloads/Research.connect/docs/installation_guide.md) — Local environment installation and setup steps.
- [Development Guide](file:///c:/Users/codew/Downloads/Research.connect/docs/development_guide.md) — Instructions for writing new routes and services.
- [Database Schema Guide](file:///c:/Users/codew/Downloads/Research.connect/database_schema.md) — Collection definitions and schema details.

---

## 🎨 Design System & Color Palette

Research Connect utilizes a premium light-theme design system. All interface elements, components, and layouts strictly adhere to the following color tokens:

### Color Tokens

| UI Element             | Color Code | Purpose / Usage                               |
| :--------------------- | :--------- | :-------------------------------------------- |
| 🔵 **Primary Blue**    | `#2563EB`  | Primary buttons, active sidebar, links, icons |
| 🔷 **Blue Hover**      | `#1D4ED8`  | Button hover, active states                   |
| 🟣 **Indigo**          | `#4F46E5`  | Highlights, badges, charts                    |
| 🟢 **Success Green**   | `#22C55E`  | Success status, citations, completed items    |
| 🟠 **Orange**          | `#F59E0B`  | Warnings, pending states, metrics             |
| 🔴 **Red**             | `#EF4444`  | Notifications, errors, alerts                 |
| ⚪ **Page Background** | `#F8FAFC`  | Main website background                       |
| 🤍 **Card Background** | `#FFFFFF`  | Cards, profile sections, widgets              |
| ⚫ **Primary Text**    | `#0F172A`  | Headings & important text                     |
| ⚫ **Secondary Text**  | `#475569`  | Description & body text                       |
| ⚪ **Border**          | `#E2E8F0`  | Card borders, inputs, dividers                |
| 🔹 **Light Blue**      | `#DBEAFE`  | Metric cards, tags, badges background         |
| 🟢 **Light Green**     | `#DCFCE7`  | Success metric background                     |
| 🟠 **Light Orange**    | `#FEF3C7`  | Warning metric background                     |
| 🟣 **Light Purple**    | `#EDE9FE`  | Research tags, AI sections                    |

### Gradients

- **Primary Gradient**: `#2563EB` ➔ `#4F46E5` (Primary Blue to Indigo)
- **Hero Background Gradient**: Radial-gradient (`#F8FAFC` ➔ `#FFFFFF`)

---

## 📂 Project Directory Structure

The project is structured with exactly two root folders, maintaining a strict separation between client and server, utilizing **Feature-First** localization.

### 💻 Frontend (Client-side)

```text
frontend/                     # React.js (Vite) Client
├── public/
├── src/
│   ├── api/
│   │   └── axiosInstance.js       # Axios instance with interceptors and toast prompts
│   ├── components/
│   │   └── common/                # Reusable Atomic UI elements
│   │       ├── buttons/           # Spinners-enabled buttons
│   │       ├── cards/             # Glassmorphic elevation-hover cards
│   │       ├── forms/             # Form wrappers
│   │       ├── inputs/            # Custom inputs, checkboxes, and selectors
│   │       ├── loaders/           # Page spinners and content skeletons
│   │       ├── modals/            # Dialog drawers with backdrop locks
│   │       └── tables/            # Pagination trackers and tables
│   ├── layouts/
│   │   ├── AppLayout/             # Main shell for all authenticated routes
│   │   ├── AuthLayout/            # Layout wrapper for registration & login pages
│   │   ├── DashboardLayout/       # Sidebar-enabled wrapper for dashboard views
│   │   ├── LandingLayout/         # Layout shell for marketing landing views
│   │   ├── Footer/                # Responsive page footer
│   │   ├── Navbar/                # Responsive header bar
│   │   └── Sidebar/               # Left navigation drawer
│   ├── routes/
│   │   ├── AppRoutes.jsx          # Router configuration (Landing, Auth, Protected Gates)
│   │   ├── HomeHub.jsx            # Auth/guest routing hub
│   │   ├── ProtectedRoute.jsx     # Block unauthenticated sessions
│   │   └── PublicRoute.jsx        # Prevents authenticated users from seeing auth pages
│   ├── redux/                     # Combined Redux Toolkit Store
│   │   ├── slices/
│   │   │   ├── appSlice.js        # Mobile menus & general loading state
│   │   │   ├── authSlice.js       # Session authentication states
│   │   │   ├── loadingSlice.js    # Global loading spinner overlay
│   │   │   ├── notificationSlice.js # Global alerts tracking
│   │   │   ├── sessionSlice.js    # Active device session configurations
│   │   │   ├── themeSlice.js      # Theme toggles and cache
│   │   │   └── userSlice.js       # User information models
│   │   └── index.js               # Combined store entry point
│   ├── services/                  # Async API client calling files
│   │   ├── auth.service.js        # Login, registration, OTP client logic
│   │   ├── profile.service.js     # Bio and user updates API client
│   │   └── help.service.js        # Client actions for Help Center tickets & info
│   ├── styles/
│   │   └── index.css              # Tailwind directives and CSS variables
│   ├── modules/                   # Feature-First Modules (16 active modules)
│   │   ├── landing/               # Landing page feature components and pages
│   │   ├── authentication/        # Auth pages (Login, Register, OTP verification, Reset)
│   │   ├── home/                  # Authenticated home feed
│   │   ├── profile/               # Academic bio profile editor & scholar view
│   │   ├── publication/           # Publication CRUD, reader, analytics, library
│   │   ├── feed/                  # Social media style research feed (trending, latest, bookmarks)
│   │   ├── project/               # Research project creation & management
│   │   ├── messaging/             # Full real-time LinkedIn-style chat system
│   │   │   ├── components/
│   │   │   │   ├── ChatWindow.jsx        # Active conversation view
│   │   │   │   ├── ConversationList.jsx  # Sidebar conversation list
│   │   │   │   ├── MessageBubble.jsx     # Individual message renderer
│   │   │   │   ├── MessageInput.jsx      # Rich message composer
│   │   │   │   ├── ResearcherInfo.jsx    # Researcher info sidebar panel
│   │   │   │   ├── NewChatModal.jsx      # Start new conversation modal
│   │   │   │   ├── TypingIndicator.jsx   # Live typing animation
│   │   │   │   └── CallOverlay.jsx       # WebRTC call UI overlay
│   │   │   └── pages/
│   │   │       └── MessagesPage.jsx      # Full messaging page
│   │   ├── notifications/         # Notification center with real-time updates
│   │   │   ├── components/
│   │   │   │   ├── NotificationBell.jsx      # Navbar bell with badge
│   │   │   │   ├── NotificationCard.jsx      # Individual notification card
│   │   │   │   ├── NotificationDropdown.jsx  # Quick dropdown from navbar
│   │   │   │   ├── NotificationFilters.jsx   # Category filter tabs
│   │   │   │   └── UnreadBadge.jsx           # Unread count badge
│   │   │   └── pages/
│   │   │       └── NotificationCenter.jsx    # Full notification page
│   │   ├── connections/           # Researcher connection requests & management
│   │   │   └── pages/
│   │   │       ├── NetworkPage.jsx           # Main network hub
│   │   │       ├── ConnectionsPage.jsx       # My connections list
│   │   │       └── InvitationsPage.jsx       # Pending invitations
│   │   ├── collaborations/        # Research collaboration workspaces
│   │   │   └── pages/
│   │   │       ├── MyWorkspaces.jsx          # Workspaces dashboard
│   │   │       ├── WorkspaceOverview.jsx     # Single workspace view
│   │   │       └── CreateWorkspace.jsx       # Workspace creation wizard
│   │   ├── follow/                # Researcher discovery and following
│   │   │   └── pages/
│   │   │       └── DiscoverResearchersPage.jsx
│   │   ├── search/                # Global academic search
│   │   ├── settings/              # User settings (scaffold)
│   │   └── legal/                 # Terms of Service and Privacy Policy
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

<br />

### ⚙️ Backend (Server-side)

```text
backend/                  # Node.js + Express.js Server
├── src/
│   ├── config/           # Setup and module configurations
│   │   ├── database/     # Mongoose connections, indexes, and seeders
│   │   ├── app.js        # Express app constants
│   │   ├── cors.js       # CORS headers configuration
│   │   ├── environment.js# Environment variable validation schema
│   │   ├── logger.js     # Winston configurations
│   │   ├── mongodb.js    # Database host validation
│   │   ├── rateLimiter.js# Security rate limits mapping
│   │   └── server.js     # Express connection parameters
│   ├── common/           # Reusable base logic and utilities
│   │   ├── errors/       # AppError hierarchy
│   │   ├── logger/       # Winston daily rotating logging manager
│   │   ├── responses/    # ApiResponse formatter
│   │   ├── repository/   # BaseRepository class (Generic CRUD Engine)
│   │   ├── service/      # BaseService class (Generic CRUD logic layer)
│   │   ├── middlewares/  # Security, request ID, logger, validators, error handlers
│   │   └── utils/        # JWT, bcrypt, OTP, and email (Nodemailer) helpers
│   ├── models/           # Mongoose schemas (83 models)
│   ├── socket/           # Socket.IO real-time infrastructure
│   │   ├── gateway/      # Socket event gateway handlers
│   │   ├── middleware/   # Socket authentication middleware
│   │   ├── presence/     # Online/offline presence tracking
│   │   ├── rooms/        # Conversation room management
│   │   └── sessions/     # Socket session state tracking
│   ├── modules/          # Feature-First Isolated Modules (22 active modules)
│   │   ├── landing/      # Landing public endpoints
│   │   ├── authentication/# Register, verify, login, 2FA OTP, token refresh
│   │   ├── profile/      # Bio updates & user synchronization
│   │   ├── scholar/      # SerpAPI Google Scholar import background job workers
│   │   ├── feed/         # Feeds, publication CRUD, comments, follows, bookmarks
│   │   ├── publication/  # Publication management
│   │   ├── follow/       # Follow/unfollow researcher actions
│   │   ├── connections/  # Researcher connection requests & management
│   │   ├── messaging/    # Real-time chat (conversations + messages + file uploads)
│   │   ├── notifications/# In-app notifications system
│   │   ├── collaborations/# Research collaboration workspaces & tasks
│   │   ├── project/      # Research project CRUD
│   │   ├── dataset/      # Research dataset management
│   │   ├── search/       # Global academic search
│   │   ├── upload/       # File upload (Cloudflare R2 / local storage)
│   │   ├── network/      # Researcher network graph
│   │   ├── presence/     # Online presence REST endpoints
│   │   ├── identity/     # Research identity management
│   │   ├── recommendations/# AI-powered researcher recommendations
│   │   ├── home/         # Home feed aggregation endpoints
│   │   └── help/         # Help Center (Support, Grievance, and Feedback)
│   ├── gateway/          # API gateway router
│   ├── jobs/             # Background job workers
│   ├── cache/            # Redis cache utilities
│   ├── app.js            # Express app setup and middleware routing
│   ├── server.js         # Server port listener and graceful shutdowns
│   └── index.js          # Startup script
├── uploads/              # Local file storage (dev fallback)
├── .env.example
├── .env
└── package.json
```

---

## 🏛️ Permanent Coding Standards & Guidelines

Refer to [.agents/AGENTS.md](file:///c:/Users/codew/Downloads/Research.connect/.agents/AGENTS.md) for full project constraints. Key guidelines include:

1. **Strict Separation of Concerns**: Routes map directly to Controllers. Controllers sanitize parameters, call Services, and output structured DTOs. Services host all transaction logic. Repositories communicate with Mongoose.
2. **Standardized Responses**:
   - **Success (HTTP 200-299)**:
     ```json
     {
       "success": true,
       "message": "Action completed successfully",
       "data": {},
       "error": null
     }
     ```
   - **Failure (HTTP 400-599)**:
     ```json
     {
       "success": false,
       "message": "Error description",
       "error": { "code": "ERROR_CODE", "details": {} }
     }
     ```
3. **Mongoose Collections**: Must support audit logging (`createdAt`, `updatedAt`), soft-delete properties (`isDeleted`, `deletedAt`), and normalized `ObjectId` references.

---

## 🗄️ Database Schemas & Collection Blueprints

For a complete breakdown of all Mongoose collections, refer to the [Database Schema Documentation](database_schema.md). The platform currently has **83 Mongoose model files**. Key collections include:

- **`users`**: Auth credentials, account status, role flags.
- **`profiles`**: Biography, social links, institutional affiliations, profile completion score.
- **`google_scholar_profiles`**: Cached Google Scholar API metrics (citations, h-index, etc.).
- **`publications`**: Academic publications, citations, and abstracts.
- **`sessions`**: Active device and browser logins.
- **`security_logs`**: Critical events auditing (failed logins, token refreshes, blocked accounts).
- **`conversations`**: Direct message conversation threads.
- **`messages`**: Individual chat messages with reactions, replies, and edit history.
- **`notifications`**: In-app notification records with type, actor, and read status.
- **`connections`**: Established researcher connections.
- **`connection_requests`**: Pending/accepted/rejected connection requests.
- **`collaborations`** / **`projects`**: Research workspace and project records.
- **`uploads`**: File metadata for Cloudflare R2 stored files.
- **`calls`**: WebRTC call log records.
- **`bookmarks`**: Foldered research bookmarks.

---

## ⚙️ Generic CRUD Repository Engine

All repositories inherit from `BaseRepository` ([base.repository.js](file:///c:/Users/codew/Downloads/Research.connect/backend/src/common/repository/base.repository.js)), which provides standard database controls:

- `create(data)` & `bulkInsert(dataArray)`
- `findById(id, populate, select)` & `findOne(filter, populate, select)`
- `find(filter, queryOptions, populate)` (supports sorting, pagination, and regex search)
- `update(id, updateData, options)` & `updateMany(filter, updateData, options)`
- `delete(id)` (hard delete) & `softDelete(id, deletedBy)` (toggles `isDeleted`, sets timestamp)
- `aggregate(pipeline)` & `count(filter)`
- `bulkUpdate(operations)` (uses Mongoose `bulkWrite` transactions)

Similarly, all business services can inherit from `BaseService` ([base.service.js](file:///c:/Users/codew/Downloads/Research.connect/backend/src/common/service/base.service.js)) for standard validation, transaction wrappers, and response mapping.

---

## 🚀 Installation & Quickstart

### Prerequisites

- Node.js (v18+)
- MongoDB (Local instance or Atlas connection string)

### 1. Configure Environment Variables

Create a `.env` file in the `backend/` directory using the keys in `.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/research_connect

# Redis Connection URL
REDIS_URI=redis://localhost:6379

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=research-connect
R2_PUBLIC_URL=https://your-r2-public-domain.com

# JWT Secret Tokens (Access and Refresh rotation)
JWT_SECRET=supersecretjwtkeyforresearchconnect
JWT_REFRESH_SECRET=supersecretjwtrefreshkeyforresearchconnect

# Email Dispatch Config (SMTP Credentials or Resend API key)
EMAIL_USER=demo@researchconnect.org
EMAIL_PASS=demopassword
RESEND_API_KEY=your_resend_api_key
```

### 2. Install Packages

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### 3. Seed Database

Run the seeder script to initialize default indices and load testing profile data:

```bash
cd ../backend
npm run seed
```

### 4. Run Development Servers

```bash
# Launch backend (from backend/)
npm run dev

# Launch frontend (from frontend/)
npm run dev
```

---

## 🔬 API Endpoint Routes Summary

All system details are accessible using versioned endpoints under `/api/v1/`:

### 1. Public Base Endpoints (`/api/*`)

- **GET `/api`**: Welcome message, check online state.
- **GET `/api/health`**: Server health metrics and system uptime.
- **GET `/api/database`**: MongoDB connection status and pool size.
- **GET `/api/stats`**: Aggregated researcher, university, and publication counts.
- **GET `/api/categories`**: Lists active academic disciplines and paper distributions.

### 2. Authentication Endpoints (`/api/v1/auth/*`)

- **POST `/register`**: Creates a pending account, hashes password, and triggers email verification OTP.
- **POST `/send-registration-otp`**: Resends email verification code (60s cooldown limit).
- **POST `/verify-registration-otp`**: Verifies registration code, activates account, and issues access & refresh tokens.
- **POST `/login`**: Validates credentials, checks brute-force limit (blocks account on 5 failures), and triggers login 2FA OTP.
- **POST `/send-login-otp`**: Resends login verification code.
- **POST `/verify-login-otp`**: Verifies 2FA login code and logs a device session.
- **POST `/forgot-password`**: Triggers password recovery OTP.
- **POST `/reset-password`**: Verifies recovery code, hashes new password, and revokes all active sessions & refresh tokens.
- **POST `/refresh-token`**: Performs Refresh Token Rotation (RTR). Revokes all active user tokens if reuse is detected.
- **POST `/logout`**: Revokes current device refresh token.
- **POST `/logout-all`**: Revokes all active refresh tokens and sessions for the user.
- **GET `/me`**: Returns current logged-in user details and profile.

### 3. Profile Endpoints (`/api/v1/profile/*`)

- **GET `/`**: Returns current authenticated researcher's profile.
- **PUT `/` or PATCH `/`**: Updates profile bio, skills, social links, and affiliation, recalculating `profileCompletion` score.
- **DELETE `/`**: Soft deletes profile and user record.

### 4. Google Scholar Integration Endpoints (`/api/v1/*`)

- **POST `/scholar/import`**: Enqueues a background job via SerpAPI to import Google Scholar metrics and publications (rate-limited).
- **POST `/scholar/reimport`**: Forces a fresh re-import of Google Scholar profile metrics.
- **POST `/scholar/sync`**: Syncs existing imported Scholar profile with the latest online metrics.
- **GET `/scholar/import-status`** or `/scholar/import/status/:jobId`: Get import queue job status.
- **GET `/scholar/profile`**: Get synced Google Scholar profile metrics.
- **GET `/scholar/publications`**: Get imported publications list.
- **GET `/scholar/coauthors`**: Get synced academic co-authors network.
- **GET `/scholar/citations`**: Get citation graphs.
- **GET `/scholar/analytics`**: Get citation trends and research area distribution.

### 5. Research Feed & Social Endpoints (`/api/v1/*`)

- **GET `/feed`**: Returns personalized research publication feed.
- **GET `/feed/trending` / `/feed/recommended` / `/feed/latest` / `/feed/following`**: Feeds filtered by citation rate, AI recommendation models, recent date, and followed users.
- **GET `/home`**: Summary view of feed, suggested profiles, and trending analytics.
- **POST `/publication`**: Creates a manual research publication entry.
- **PUT `/publication/:id`**: Edits a publication.
- **DELETE `/publication/:id`**: Soft-deletes a publication.
- **POST `/publication/like`**: Likes or unlikes a publication.
- **POST `/publication/bookmark`**: Bookmarks a publication into a specific folder.
- **POST `/bookmark/move`**: Moves bookmark to a different folder.
- **GET `/bookmark/folders`**: Get all bookmarks folder list.
- **POST `/publication/share`**: Records paper sharing metrics.
- **POST `/publication/recommend`**: Recommends a publication.
- **POST `/publication/comment`**: Adds a comment/reply to a publication.
- **GET `/publication/:publicationId/comments`**: Retrieves the comment thread for a paper.
- **POST `/follows/:userId`**: Follows or unfollows a researcher.
- **GET `/suggested-researchers`**: Get platform suggestions of researchers to follow.
- **GET `/publication/:id/similar`**: Fetch structurally or semantically similar publications.
- **POST `/publication/ai-summary`**: Generates an AI-powered summary of the publication.

### 6. Connections Endpoints (`/api/v1/connections/*`)

- **GET `/`**: Get the authenticated user's connections list.
- **GET `/requests/received`**: Get all incoming connection requests.
- **GET `/requests/sent`**: Get all outgoing connection requests.
- **GET `/status/:researcherId`**: Get connection status with a specific researcher.
- **POST `/request/:researcherId`**: Send a connection request to a researcher.
- **PATCH `/accept/:requestId`**: Accept a received connection request.
- **PATCH `/reject/:requestId`**: Reject a received connection request.
- **PATCH `/withdraw/:requestId`**: Withdraw a sent connection request.
- **DELETE `/remove/:connectionId`**: Remove an established connection.

### 7. Messaging Endpoints (`/api/v1/messages/*`)

- **GET `/`**: List all conversations for the authenticated user.
- **POST `/`**: Send a new message (creates conversation if not existing).
- **GET `/search`**: Search messages across all conversations.
- **GET `/shared-files`**: Get all shared file attachments.
- **GET `/contacts`**: Get messaging contacts (connections + followers/following with online status).
- **GET `/requests`**: Get pending connection requests for the messaging Requests tab.
- **PATCH `/read`**: Mark messages as read.
- **POST `/upload`**: Upload a file attachment (multipart/form-data).
- **GET `/:conversationId`**: Get paginated message history for a conversation.
- **PATCH `/:id`**: Edit a sent message.
- **DELETE `/:id`**: Delete a message (for everyone or just for me).
- **POST `/:id/reply`**: Reply to a specific message.
- **POST `/:id/react`**: Add or remove an emoji reaction to a message.
- **POST `/group/create`**: Create a group conversation.
- **POST `/group/invite`**: Invite a user to a group.
- **POST `/call/start`** / **POST `/call/end`**: Log WebRTC call start/end events.
- **GET `/call/history`**: Get call history logs.

### 8. Conversations Endpoints (`/api/v1/conversations/*`)

- **GET `/`**: List all conversations.
- **POST `/`**: Start or retrieve an existing conversation.
- **GET `/:conversationId`**: Get a single conversation by ID.
- **DELETE `/:conversationId`**: Delete a conversation.
- **PATCH `/:conversationId/pin`** / **`/unpin`**: Pin or unpin a conversation.
- **PATCH `/:conversationId/archive`** / **`/restore`**: Archive or restore a conversation.
- **PATCH `/:conversationId/mute`** / **`/unmute`**: Mute or unmute a conversation.

### 9. Notifications Endpoints (`/api/v1/notifications/*`)

- **GET `/`**: Get paginated notifications list (supports type filtering).
- **GET `/unread-count`**: Get the total unread notification count.
- **PATCH `/read-all`**: Mark all notifications as read.
- **PATCH `/settings`**: Update notification preferences.
- **DELETE `/clear-all`**: Delete all notifications for the user.
- **PATCH `/:notificationId/read`**: Mark a single notification as read.
- **DELETE `/:notificationId`**: Delete a single notification.

### 10. Collaborations Endpoints (`/api/v1/collaborations/*`)

- **POST `/`**: Create a new research collaboration workspace.
- **GET `/`**: Get all collaboration workspaces for the authenticated user.
- **GET `/:slug`**: Get a specific workspace by slug.
- **DELETE `/:id`**: Delete a workspace.
- **POST `/:id/invite`**: Invite a researcher to join a workspace.
- **PATCH `/invitations/:id/accept`**: Accept a workspace invitation.
- **PATCH `/invitations/:id/reject`**: Reject a workspace invitation.
- **POST `/:id/tasks`**: Create a task inside a workspace.
- **PATCH `/:id/tasks/:taskId`**: Update a task's status.
- **POST `/:id/files`**: Add a file to a workspace.
- **POST `/:id/meetings`**: Schedule a meeting inside a workspace.

### 11. Search Endpoints (`/api/v1/search/*`)

- **GET `/`**: Global search across publications, users, and tags.

### 12. Uploads Endpoints (`/api/v1/uploads/*`)

- **POST `/`**: Upload a file to Cloudflare R2 (or local storage in dev).

### 13. Presence Endpoints (`/api/v1/presence/*`)

- **GET `/`**: Get online presence of specified user IDs.

### 14. Recommendations Endpoints (`/api/v1/recommendations/*`)

- **GET `/`**: Get AI-powered researcher recommendations.

### 15. Network Endpoints (`/api/v1/network/*`)

- **GET `/`**: Get researcher network graph data.

### 16. Help Center Endpoints (`/api/v1/help/*`)

- Submit support tickets, grievances, and feedback forms.

---

## 🔌 Real-Time Socket.IO Infrastructure

Research Connect runs a full Socket.IO layer alongside the Express server. The socket system is organized into isolated handlers inside `backend/src/socket/`.

### Messaging Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client → Server | Send a new message |
| `message:receive` | Server → Client | Receive a new message |
| `message:read` | Client → Server | Mark messages as read |
| `message:edit` | Client → Server | Edit a sent message |
| `message:delete` | Client → Server | Delete a message |
| `message:react` | Client → Server | Add/remove a reaction |
| `typing:start` | Client → Server | Notify typing started |
| `typing:stop` | Client → Server | Notify typing stopped |

### Presence Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `presence:online` | Server → Client | User came online |
| `presence:offline` | Server → Client | User went offline |
| `presence:status` | Client → Server | Set custom presence status |

### Notification Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `notification:new` | Server → Client | Push a new notification to client |
| `notification:read` | Client → Server | Mark notification as read |

### Call Events (WebRTC Signaling)
| Event | Direction | Description |
|-------|-----------|-------------|
| `call:initiate` | Client → Server | Initiate a voice/video call |
| `call:accept` | Client → Server | Accept an incoming call |
| `call:reject` | Client → Server | Reject an incoming call |
| `call:end` | Client → Server | End an active call |
| `call:signal` | Client ↔ Server | WebRTC SDP/ICE signal relay |

---

## 📦 Tech Stack Summary

### Backend
| Package | Version | Purpose |
|---------|---------|----------|
| `express` | ^4.19 | HTTP server framework |
| `mongoose` | ^8.2 | MongoDB ODM |
| `socket.io` | ^4.8 | Real-time WebSocket server |
| `redis` | ^6.1 | Session store & caching |
| `jsonwebtoken` | ^9.0 | JWT access/refresh tokens |
| `bcryptjs` | ^2.4 | Password hashing |
| `nodemailer` | ^9.0 | Email dispatch (OTP, alerts) |
| `helmet` | ^7.1 | HTTP security headers |
| `express-rate-limit` | ^8.5 | API rate limiting |
| `rate-limit-redis` | ^5.0 | Redis-backed rate limiting |
| `multer` | ^1.4 | File upload handling |
| `@aws-sdk/client-s3` | ^3.x | Cloudflare R2 storage |
| `winston` | ^3.12 | Structured logging |
| `tesseract.js` | ^7.0 | OCR for image files |
| `pdf-parse` | ^2.4 | PDF text extraction |
| `natural` | ^8.1 | NLP utilities |
| `compression` | ^1.7 | Response compression |

### Frontend
| Package | Version | Purpose |
|---------|---------|----------|
| `react` | ^18.2 | UI library |
| `react-router-dom` | ^6.22 | Client-side routing |
| `@reduxjs/toolkit` | ^2.2 | Global state management |
| `@tanstack/react-query` | ^5.24 | Server state & caching |
| `axios` | ^1.6 | HTTP client with interceptors |
| `socket.io-client` | ^4.8 | Real-time WebSocket client |
| `framer-motion` | ^11.0 | Animations & transitions |
| `react-hook-form` | ^7.51 | Form state management |
| `react-hot-toast` | ^2.4 | Toast notifications |
| `recharts` | ^3.9 | Data visualization charts |
| `lucide-react` | ^0.344 | Icon library |
| `tailwindcss` | ^3.4 | Utility-first CSS framework |
| `vite` | ^5.1 | Build tool & dev server |
#   r a i l w a y - d e p l o y  
 #   r a i l w a y - d e p l o y  
 #   d e p l o y r a i l w a y  
 #   d e p l o y r a i l w a y  
 #   d e p l o y r a i l w a y  
 