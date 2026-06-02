#!/bin/bash

echo "🚀 Starting PlayHost Setup..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
npm run prisma:migrate

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed

echo "✅ Setup complete!"
echo "🎮 Start with: npm run dev"
