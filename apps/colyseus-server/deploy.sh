#!/bin/bash

# Vibechess Colyseus Server Deployment Script
# Usage: ./deploy.sh [production|development]

set -e

ENV=${1:-development}

echo "🚀 Deploying Colyseus Server in $ENV mode..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file. Please configure it before proceeding.${NC}"
        exit 1
    else
        echo -e "${RED}❌ env.example not found!${NC}"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

if [ "$ENV" == "production" ]; then
    echo "🐳 Building Docker containers..."
    docker-compose build
    
    echo "🚀 Starting Docker containers..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 5
    
    echo "🏥 Checking health..."
    if curl -f http://localhost:2567/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is healthy!${NC}"
    else
        echo -e "${RED}❌ Health check failed!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo "📊 Monitor with: docker-compose logs -f"
    echo "🛑 Stop with: docker-compose down"
    
elif [ "$ENV" == "development" ]; then
    echo "🔧 Starting development server..."
    npm run dev
else
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Usage: ./deploy.sh [production|development]"
    exit 1
fi

