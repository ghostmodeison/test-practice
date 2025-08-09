# Base image
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the app
RUN npm run build

# Final image (using alpine for small size)
FROM node:18-alpine

WORKDIR /app

# Copy from build stage
COPY --from=build /app .

# Use non-root user for security
USER node

EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
