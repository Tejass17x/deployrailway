FROM node:20-alpine

# Install build dependencies for native node modules (like bcrypt, sharp, etc.) if needed
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (production & development for local build compatibility)
RUN npm ci

# Copy rest of the backend codebase
COPY . .

# Expose port (default Express backend port is 5000)
EXPOSE 5000

# Default command starts the REST API backend
CMD ["node", "src/server.js"]
