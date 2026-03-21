#!/bin/bash

# Invoices Service Development Setup Script

set -e

echo "🚀 Setting up Invoices Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d postgres rabbitmq

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U invoices_user -d invoices_db; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run database migrations (if any)
echo "🗄️  Running database setup..."
# npm run migration:run

echo "🎉 Setup complete!"
echo ""
echo "🚀 You can now start the development server:"
echo "   npm run start:dev"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:3000/api/v1/docs"
echo ""
echo "🐰 RabbitMQ Management UI:"
echo "   http://localhost:15672 (invoices/change_me)"
echo ""
echo "🗄️  PostgreSQL Connection:"
echo "   Host: localhost:5432"
echo "   Database: invoices_db"
echo "   User: invoices_user"
echo "   Password: change_me"
