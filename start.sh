#!/bin/bash

# Quick Start Script for AI Agent

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  🤖 AI Agent Setup & Run                   ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✓ .env created"
    echo ""
    echo "📝 Please edit .env with your credentials:"
    echo "   - GEMINI_API_KEY (required)"
    echo "   - GOOGLE_OAUTH_CLIENT_ID (optional, for GCP projects)"
    echo "   - GOOGLE_OAUTH_CLIENT_SECRET (optional)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if GEMINI_API_KEY is set
if grep -q "GEMINI_API_KEY=your_google_gemini_api_key_here" .env; then
    echo "❌ GEMINI_API_KEY not configured in .env"
    echo "Please update .env with your actual API key"
    exit 1
fi

# Build TypeScript
echo "🔨 Building project..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "❌ Build failed"
    npm run build
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting AI Agent..."
echo ""

# Run the application
npm start
