#!/bin/bash

# SmartEdu360 Deployment Script

echo "🚀 Starting SmartEdu360 deployment..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Build the application
echo "🏗️ Building application..."
npm run build

# Run database migrations (if needed)
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🗄️ Running database migrations..."
    npm run db:migrate
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application is ready to serve"