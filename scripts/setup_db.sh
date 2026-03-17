#!/bin/bash
# Database initialization script
# Run database migrations and seed data

set -e

echo "🔧 Running Afribok Database Migrations..."

# Navigate to backend directory
cd backend

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --quiet -r requirements.txt

# Run migrations
echo "🔄 Running database migrations..."
python -m alembic upgrade head

# Seed initial data
echo "🌱 Seeding database..."
python scripts/seed_db.py

echo "✅ Database setup complete!"
