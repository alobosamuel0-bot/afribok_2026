# Afribok 2026 - Enterprise Healthcare System

A world-class, scalable healthcare management system designed to serve **1+ million concurrent users** with:
- ✅ Offline-first architecture with intelligent sync
- ✅ Hospital resource optimization (beds, staff, equipment)
- ✅ AI-powered patient risk prediction
- ✅ Works on any infrastructure (Africa-first design)
- ✅ Patient safety as top priority
- ✅ Multi-hospital coordination

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# Clone and setup
git clone <repo>
cd afribok_2026

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Database
python manage.py db:migrate
python manage.py db:seed

# Run
python -m uvicorn core.app:app --reload

# Frontend setup
cd ../frontend
npm install
npm start
```

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│          Frontend (React Native/Web)                 │
│  (Offline-capable, Progressive Web App)              │
└────────────────────┬────────────────────────────────┘
                     │
     ┌───────────────┴───────────────┐
     │  Offline-First Sync Engine     │
     │  (IndexedDB, SQLite)           │
     └───────────────┬───────────────┘
                     │
┌─────────────────────┴──────────────────────────┐
│        API Layer (FastAPI, Async)              │
│  Auth │ Patients │ Beds │ Staff │ Predictions │
└─────────────────────┬──────────────────────────┘
                     │
   ┌─────────┬───────┴────────┬──────────┐
   │         │                │          │
┌──┴───┐  ┌──┴───┐      ┌─────┴──┐   ┌──┴──┐
│Local │  │Cache │      │ ML/AI  │   │Sync │
│DB    │  │Layer │      │Engine  │   │Mgr  │
└──────┘  └──────┘      └────────┘   └─────┘
   │
┌──────────────────────────────────┐
│  PostgreSQL (Central Database)    │
│  Partitioned for 1M+ users        │
└──────────────────────────────────┘
```

## Key Features

### 1. Offline-First Sync
- Local SQLite for offline operation
- Smart queue-based sync when online
- Conflict resolution (last-write-wins with audit)
- Works even on 2G connections

### 2. Patient Safety
- Risk scoring on every admission
- Real-time capacity alerts
- Doctor workload monitoring
- Drug-allergy cross-checks

### 3. Scalability
- Horizontal DB scaling (PostgreSQL partitioning)
- Microservices-ready architecture
- Redis caching for hot data
- Async/queue-based processing

### 4. Data Integrity
- Immutable audit logs
- Transaction-safe operations
- Conflict detection and resolution
- HIPAA/GDPR compliance ready

## Project Structure

```
afribok_2026/
├── backend/
│   ├── core/              # FastAPI app, global config
│   ├── db/                # Database models, migrations
│   ├── api/               # REST endpoints
│   ├── services/          # Business logic
│   ├── sync/              # Offline sync engine
│   ├── ml/                # Prediction models
│   ├── security/          # Auth, encryption
│   ├── tasks/             # Async background jobs
│   ├── utils/             # Helpers, validators
│   └── tests/             # Unit & integration tests
├── frontend/              # React/React Native UI
├── docker/                # Docker configs
├── config/                # K8s, process manager configs  
├── scripts/               # DB seeds, migrations
└── docs/                  # Architecture, API docs
```

## Development

### Run Tests
```bash
pytest backend/tests/ -v
```

### Database Migrations
```bash
python manage.py db:new "add payment status"
python manage.py db:migrate
python manage.py db:rollback
```

### Build Docker
```bash
docker-compose -f docker/compose.yml build
docker-compose -f docker/compose.yml up -d
```

## Deployment

The system is production-ready and designed for:
- **Kubernetes**: See `config/k8s/`
- **Docker Swarm**: See `docker/swarm/`
- **Traditional VMs**: See `config/systemd/`

## Performance Targets

- **API Latency**: < 200ms (p95)
- **DB Queries**: < 100ms (p95)
- **Sync**: < 5min for 10K records
- **Concurrent Users**: 1M+
- **Availability**: 99.95% uptime

## Security

- JWT + OAuth2 authentication
- Role-based access control (RBAC)
- End-to-end encryption for sensitive data
- SQL injection prevention (parameterized queries)
- Rate limiting & DDoS protection
- Immutable audit logs

## License

MIT

## Support

For issues, feature requests, or questions:
- 📧 Email: support@afribok.io
- 🐛 Issues: GitHub Issues
- 📖 Docs: https://afribok.io/docs
