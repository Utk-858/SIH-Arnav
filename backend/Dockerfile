# Use Node.js 18 Bullseye (Debian) which has Python pre-installed - v2
FROM node:18-bullseye AS base

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create a new stage for building the application
FROM node:18-bullseye AS builder

WORKDIR /app

# Python and build tools are pre-installed in Debian

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Copy Google Cloud credentials
COPY google-credentials-solveai.json /app/google-credentials-solveai.json

# Build the TypeScript application
RUN npm run build

# Production stage
FROM node:18-bullseye AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -g 1001 nodejs
RUN useradd -s /bin/bash -u 1001 -g nodejs nextjs

# Copy package files
COPY package*.json ./

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/google-credentials-solveai.json /app/google-credentials-solveai.json

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Create directory for SQLite database if it doesn't exist
RUN mkdir -p /app/data

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const req=http.request({hostname:'localhost',port:8080,path:'/health'},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]