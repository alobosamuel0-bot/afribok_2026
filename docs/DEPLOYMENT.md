# Deployment Guide - Afribok 2026

## Prerequisites

- Docker & Docker Compose 20.10+
- PostgreSQL 15+ (if not using Docker)
- Python 3.11+
- Node.js 18+ (for frontend)
- Git

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/afribok_2026.git
cd afribok_2026
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run with Docker Compose
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 4. Initialize Database
```bash
docker exec afribok_backend python manage.py db:migrate
docker exec afribok_backend python manage.py db:seed
```

### 5. Check Services
```bash
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Redis: localhost:6379
# PostgreSQL: localhost:5432
```

## Docker Deployment

### Build Image
```bash
docker build -f docker/Dockerfile.backend -t afribok:latest .
```

### Push to Registry
```bash
docker tag afribok:latest your.registry.com/afribok:latest
docker push your.registry.com/afribok:latest
```

### Run Container
```bash
docker run -d \
  --name afribok \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e CENTRAL_DB_URL=postgresql://... \
  -e JWT_SECRET_KEY=your-secret \
  your.registry.com/afribok:latest
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3+ (optional)

### Deploy using Helm
```bash
helm install afribok ./config/helm/afribok \
  --namespace healthcare \
  --values config/helm/values-prod.yaml
```

### Deploy using kubectl
```bash
kubectl apply -f config/k8s/namespace.yaml
kubectl apply -f config/k8s/secrets.yaml
kubectl apply -f config/k8s/configmap.yaml
kubectl apply -f config/k8s/deployment.yaml
kubectl apply -f config/k8s/service.yaml
```

### Verify Deployment
```bash
kubectl get pods -n healthcare
kubectl logs -f deployment/afribok -n healthcare
```

## Traditional Server Deployment (VPS)

### 1. Install Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3.11 postgresql redis-server nginx

# Create application user
sudo useradd -m -s /bin/bash afribok
```

### 2. Clone Application
```bash
sudo -u afribok git clone https://github.com/your-org/afribok_2026.git /opt/afribok
cd /opt/afribok
```

### 3. Setup Python Environment
```bash
sudo -u afribok python3.11 -m venv venv
sudo -u afribok venv/bin/pip install -r backend/requirements.txt
```

### 4. Configure PostgreSQL
```bash
sudo -u postgres psql -c "CREATE DATABASE afribok;"
sudo -u postgres psql -c "CREATE USER afribok WITH PASSWORD 'securepassword';"
```

### 5. Run Database Migrations
```bash
cd backend
sudo -u afribok venv/bin/python manage.py db:migrate
```

### 6. Setup Systemd Service
Create `/etc/systemd/system/afribok.service`:
```ini
[Unit]
Description=Afribok Healthcare API
After=network.target postgresql.service redis-server.service

[Service]
Type=notify
User=afribok
WorkingDirectory=/opt/afribok/backend
ExecStart=/opt/afribok/venv/bin/uvicorn core.app:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 7. Configure Nginx
Create `/etc/nginx/sites-available/afribok`:
```nginx
upstream afribok_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    # Proxy to backend
    location / {
        proxy_pass http://afribok_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

### 8. Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable afribok redis-server
sudo systemctl start afribok
```

## Monitoring & Logging

### Sentry Error Tracking
```bash
# Set SENTRY_DSN in .env
export SENTRY_DSN=https://key@sentry.io/123456
```

### Application Logs
```bash
# View logs
tail -f /var/log/afribok/app.log

# Archive old logs (rotation)
logrotate /etc/logrotate.d/afribok
```

### Database Backups
```bash
# Daily backup script
0 2 * * * /usr/local/bin/backup-afribok.sh

# Backup script:
#!/bin/bash
pg_dump -U afribok afribok | gzip > /backups/afribok_$(date +%Y%m%d).sql.gz
# Upload to S3, GCS, etc.
```

## Scaling

### Horizontal Scaling
```bash
# Start multiple API instances behind load balancer
docker run -d --name afribok-1 -p 8001:8000 afribok:latest
docker run -d --name afribok-2 -p 8002:8000 afribok:latest
docker run -d --name afribok-3 -p 8003:8000 afribok:latest

# Nginx load balancing config:
upstream afribok {
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}
```

### Database Scaling
```bash
# PostgreSQL replication
# Create standby server with streaming replication
pg_basebackup -h primary.example.com -U replication -v -P -W -D /var/lib/postgresql/data
```

### Cache Scaling
```bash
# Redis Cluster
redis-cluster create 127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381
```

## Performance Tuning

### Backend
```bash
# Increase workers based on CPU cores
# workers = (2 * cpu_cores) + 1
uvicorn core.app:app --workers 9  # For 4-core system
```

### Database
```sql
-- Optimize indexing
CREATE INDEX idx_patient_hospital_admission 
ON patients(hospital_id, admission_time DESC);

-- Connection pooling
max_connections = 300
```

### Redis
```bash
# Increase memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
appendonly yes
```

## Troubleshooting

### High API Response Time
```bash
# Check database connections
# Check cache hit rate
# Check slow queries logs
```

### Sync Failures
```bash
# Check network connectivity
# Verify database permissions
# Review sync queue size
```

### Memory Issues
```bash
# Monitor application memory
docker stats

# Check for memory leaks
# Adjust worker count
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Test disaster recovery

## Health Checks

```bash
# API health
curl http://localhost:8000/health

# Database
pg_isready -h localhost -U afribok

# Redis
redis-cli ping

# Full system check
docker-compose -f docker/docker-compose.yml exec backend python manage.py health:check
```

## Support

For issues or questions:
- 📧 support@afribok.io
- 🐛 GitHub Issues
- 📖 Documentation: https://afribok.io/docs
