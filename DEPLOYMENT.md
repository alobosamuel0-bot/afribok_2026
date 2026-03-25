# Afribok 2026 - Deployment Guide

## Quick Start - Railway.app (Recommended)

Railway is the fastest way to deploy Afribok. It handles all infrastructure automatically.

### Prerequisites
- GitHub account (repository already connected)
- Railway account (free tier available)

### Deployment Steps

1. **Go to Railway.app**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose `afribok_2026` repository

3. **Configure Environment**
   - Railway will auto-detect the Dockerfile
   - Add environment variables in Railway dashboard:
     ```
     DATABASE_URL=postgresql://...
     REDIS_URL=redis://...
     SECRET_KEY=your-secret-key
     ENVIRONMENT=production
     ```

4. **Deploy**
   - Railway automatically deploys on push to main branch
   - Your app will be live at: `https://your-app.railway.app`

---

## Local Development with Docker

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11+
- Node.js 18+

### Setup

1. **Clone and Navigate**
   ```bash
   git clone https://github.com/alobosamuel0-bot/afribok_2026.git
   cd afribok_2026
   ```

2. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Access Services**
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Frontend: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

5. **Stop Services**
   ```bash
   docker-compose down
   ```

---

## Manual Deployment (Heroku, AWS, etc.)

### Backend Deployment

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**
   ```bash
   export DATABASE_URL=postgresql://...
   export REDIS_URL=redis://...
   export SECRET_KEY=your-secret-key
   ```

3. **Run Migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start Server**
   ```bash
   uvicorn core.app:app --host 0.0.0.0 --port 8000
   ```

### Frontend Deployment

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify/Vercel**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```

---

## Production Checklist

- [ ] Set `DEBUG=false` in environment
- [ ] Use strong `SECRET_KEY`
- [ ] Configure PostgreSQL with backups
- [ ] Set up Redis for caching
- [ ] Configure email (SMTP) for notifications
- [ ] Set up Twilio for SMS/WhatsApp
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up monitoring (Sentry)
- [ ] Configure database backups
- [ ] Set up log aggregation
- [ ] Test all API endpoints
- [ ] Load test the system
- [ ] Set up CI/CD pipeline

---

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql postgresql://user:password@host:5432/afribok

# Check connection string format
# postgresql://username:password@host:port/database
```

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Docker Build Issues
```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

---

## Monitoring & Logs

### View Logs
```bash
# Docker logs
docker-compose logs -f backend

# Railway logs
# View in Railway dashboard
```

### Health Check
```bash
curl http://localhost:8000/health
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Support

For deployment issues:
1. Check logs: `docker-compose logs backend`
2. Verify environment variables
3. Test database connection
4. Check API health: `/health` endpoint
5. Review Railway/hosting provider documentation
