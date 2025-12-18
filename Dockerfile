FROM node:20-bullseye-slim AS base

# Declaring envs
ENV LEVEL=${LEVEL}
ENV PORT=5000

# Configure Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Setting up the work directory
WORKDIR /es-erp-api

# Install Chromium and dependencies
# Using chromium from apt ensures all dependencies are properly resolved
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install zed CLI for SpiceDB schema management
# First get the latest version, then download the correct file
RUN export ZED_VERSION=$(curl -s https://api.github.com/repos/authzed/zed/releases/latest | grep '"tag_name"' | cut -d '"' -f 4) && \
    curl -L -o /tmp/zed.tar.gz "https://github.com/authzed/zed/releases/download/${ZED_VERSION}/zed_${ZED_VERSION#v}_linux_amd64_gnu.tar.gz" && \
    tar -xzf /tmp/zed.tar.gz -C /tmp && \
    mv /tmp/zed /usr/local/bin/zed && \
    chmod +x /usr/local/bin/zed && \
    rm /tmp/zed.tar.gz

# Copying all the files in our project
COPY . .

# Installing dependencies
RUN npm install --force

# Build
RUN npm run build

# Ensure production-only logic is enabled in the container
ENV NODE_ENV=production

# Starting our application
CMD ["npm", "run", "start", "--", "-p", "5000"]

# Exposing server port
EXPOSE 5000
