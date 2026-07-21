# Research Connect — Installation Guide

Follow this guide to install dependencies, configure environment variables, seed testing data, and run **Research Connect** locally.

---

## 📋 Prerequisites
Ensure you have the following installed on your system:
- **Node.js**: v18.x or higher
- **NPM**: v9.x or higher
- **MongoDB**: A running local MongoDB instance or a MongoDB Atlas URI string
- **Redis**: v6.x or higher running locally or a secure Cloud Redis URL (e.g. Upstash)

---

## 🛠️ Step-by-Step Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ResearchConnect
```

### 2. Configure Environment Variables
Copy the `.env.example` file in the `backend` folder and create a `.env` file:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and configure the following parameters:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/research_connect

# Redis Configuration (For Sessions, OTP, and rate limiting)
REDIS_URI=redis://localhost:6379

# Cloudflare R2 Configuration (For PDF, image, and asset storage)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=research-connect
R2_PUBLIC_URL=https://your-r2-public-domain.com

# JWT Secret Tokens (Access and Refresh rotation)
JWT_SECRET=supersecretjwtkeyforresearchconnect
JWT_REFRESH_SECRET=supersecretjwtrefreshkeyforresearchconnect

# Email Dispatch Config (Resend API key or SMTP details for registration OTPs)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
RESEND_API_KEY=your_resend_api_key

# Academic API Key (Required for Google Scholar Author data sync)
SERP_API_KEY=your_serp_api_token
```

### 3. Install Backend Dependencies
Navigate to the backend directory and install the necessary npm packages:
```bash
cd backend
npm install
```

### 4. Seed the Database
Run the seed script to:
1. Initialize the MongoDB connection pool.
2. Synchronize and check database collection indices (`config/database/indexes.js`).
3. Populate mock testing profiles, feed publications, questions, and projects.
```bash
npm run seed
```

### 5. Install Frontend Dependencies
Navigate to the frontend directory and install the client packages:
```bash
cd ../frontend
npm install
```

---

## 🚀 Running the Platform

To run the application in a local development environment, you must launch both the backend API server and the frontend client server.

### Running Backend (API Server)
From the `backend` directory:
```bash
npm run dev
```
- The backend server runs by default on `http://localhost:5000`.
- API endpoints are versioned under `/api/v1/...`.
- Structured logs will output to the terminal and rotate in `backend/logs/*.log`.

### Running Frontend (Vite Client)
From the `frontend` directory:
```bash
npm run dev
```
- The frontend dev server runs by default on `http://localhost:5173`.
- Open this URL in your web browser.
- Uses hot module replacement (HMR) for fast view updates.
