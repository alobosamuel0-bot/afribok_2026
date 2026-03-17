# Afribok 2026 - Developer Quick Reference

## 🚀 Getting Started (5 Minutes)

### 1. Prerequisites
```bash
# Install Docker & Docker Compose
# Python 3.11+ (for local development)
# Node.js 18+ (for frontend)
```

### 2. Clone & Setup
```bash
git clone <repo>
cd afribok_2026
cp .env.example .env
```

### 3. Start Backend
```bash
docker-compose -f docker/docker-compose.yml up -d

# Wait 30 seconds for services to start
sleep 30

# Check health
curl http://localhost:8000/health
```

### 4. Access Services
| Service | URL | Use Case |
|---------|-----|----------|
| API | http://localhost:8000 | REST endpoints |
| Docs | http://localhost:8000/docs | Swagger UI |
| ReDoc | http://localhost:8000/redoc | ReDoc UI |
| Frontend | http://localhost:3000 | React app (not running yet) |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

---

## 📝 Code Examples

### Create a Patient (API Call)

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/patients/admit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "national_id": "12345678",
    "age": 45,
    "gender": "M",
    "phone": "+256701234567",
    "address": "Kampala, Uganda",
    "disease_ids": [1],
    "allergies": ["Penicillin"],
    "chronic_conditions": [],
    "emergency_contact": "Jane Doe +256701234568"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Patient admitted successfully",
  "data": {
    "patient_id": "PAT-001",
    "external_id": "EXT-12345",
    "risk_score": 45.5,
    "assigned_bed": "BED-ICU-001",
    "status": "admitted",
    "created_at": "2026-03-17T15:30:00Z"
  }
}
```

### Record Vital Signs

```bash
curl -X POST http://localhost:8000/api/v1/patients/PAT-001/vitals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "temperature": 37.5,
    "heart_rate": 78,
    "blood_pressure_sys": 120,
    "blood_pressure_dia": 80,
    "respiratory_rate": 16,
    "oxygen_saturation": 98.5,
    "notes": "Patient stable"
  }'
```

### Get Predictions

```bash
curl -X GET http://localhost:8000/api/v1/predictions/capacity \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔑 Key Concepts

### 1. Offline-First Architecture
- Local SQLite database for offline operation
- SyncQueue table tracks pending operations
- Auto-sync when internet returns
- Conflict resolution: last-write-wins

```python
# How it works:
1. User admits patient → Stored locally in SQLite
2. Operation queued in SyncQueue
3. When online → Background sync to PostgreSQL
4. If conflict → Last write timestamp wins
```

### 2. Risk Scoring Algorithm
```python
risk_score = (age_factor * 0.3) + \
             (disease_severity * 0.4) + \
             (chronic_count * 0.2) + \
             (vital_abnormality * 0.1)

# Example:
# Age 75+ = 30 points
# Critical disease = 40 points
# 2 chronic conditions = 20 points
# Abnormal vitals = 10 points
# Total = 100 (ICU admission)
```

### 3. Bed Assignment Priority
```
ICU Beds (Risk > 70)
  ↓
Regular Beds (Risk 50-70)
  ↓
Buffer Beds (Risk < 50)
```

### 4. ML Predictions
- **Prophet (60%)**: Captures seasonality, trends
- **XGBoost (40%)**: Catches irregular patterns
- **Output**: 14-day forecast with 95% confidence interval

---

## 🔐 Authentication

### Get Access Token
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor@hospital.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Token Structure
```
Header: {"alg": "HS256", "typ": "JWT"}
Payload: {
  "sub": "user_id",
  "role": "doctor",
  "scopes": ["read:patients", "write:patients"],
  "exp": 1234567890
}
```

### User Roles
| Role | Permissions |
|------|------------|
| Admin | All operations, system config |
| Doctor | Full patient care, admits, discharge |
| Nurse | Record vitals, patient info, monitoring |
| Patient | View own records, contact doctor |
| Lab Tech | Record lab results |

---

## 🗄️ Database Quick Reference

### Connect to PostgreSQL
```bash
psql postgresql://afribok:password@localhost:5432/afribok_2026
```

### Common Queries

**Find patient by ID:**
```sql
SELECT * FROM patients WHERE id = 'PAT-001';
```

**Get admitted patients:**
```sql
SELECT * FROM patients WHERE status = 'admitted';
```

**Check audit log:**
```sql
SELECT * FROM audit_logs WHERE patient_id = 'PAT-001' ORDER BY created_at DESC;
```

**Bed availability:**
```sql
SELECT bed_id, status, assigned_patient_id, bed_type 
FROM beds 
WHERE hospital_id = 1 
  AND status = 'available';
```

**Pending sync operations:**
```sql
SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at;
```

### Connect to Local SQLite
```bash
sqlite3 afribok_local.db
```

---

## 🔍 Debugging Tips

### Check API Logs
```bash
docker-compose logs -f backend
```

### Check Database Logs
```bash
docker-compose logs -f postgres
```

### Test API Endpoint
```bash
# Simple health check
curl http://localhost:8000/health

# With verbose output
curl -v http://localhost:8000/api/v1/patients
```

### Monitor Sync Queue
```bash
# Check pending operations
sqlite3 afribok_local.db "SELECT COUNT(*) FROM sync_queue WHERE status='pending';"

# In PostgreSQL
psql postgresql://afribok:password@localhost:5432/afribok_2026 \
  -c "SELECT COUNT(*) FROM sync_queue WHERE status='pending';"
```

### View Structured Logs
```bash
# Logs are in JSON format
docker-compose logs backend | jq .

# Filter by level
docker-compose logs backend | jq 'select(.level=="ERROR")'
```

---

## 📊 API Reference

### Patients
```
POST   /api/v1/patients/admit          - Admit patient
GET    /api/v1/patients/{id}           - Get patient details
POST   /api/v1/patients/{id}/vitals    - Record vitals
POST   /api/v1/patients/{id}/discharge - Discharge patient
GET    /api/v1/patients                - List patients (with filters)
```

### Authentication
```
POST   /auth/login                     - Get access token
POST   /auth/refresh                   - Refresh token
POST   /auth/logout                    - Logout
```

### Predictions
```
GET    /api/v1/predictions/admissions  - 14-day admission forecast
GET    /api/v1/predictions/beds        - Bed demand prediction
GET    /api/v1/predictions/capacity    - Hospital capacity analysis
```

### Admin
```
GET    /api/v1/admin/audit-logs        - View audit trail
GET    /api/v1/admin/sync-status       - Sync queue status
GET    /api/v1/admin/health            - System health
```

---

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Run Integration Tests
```bash
python -m pytest tests/integration/ -v
```

### Run Load Test
```bash
# Install locust
pip install locust

# Create locustfile.py and run
locust -f locustfile.py --host=http://localhost:8000
```

### Test Offline Sync
```python
# Stop PostgreSQL
docker-compose stop postgres

# Make changes (they queue locally)
curl -X POST http://localhost:8000/api/v1/patients/admit ...

# Restart PostgreSQL
docker-compose start postgres

# Sync should happen automatically
```

---

## 🚨 Common Issues

### Issue: "Connection refused"
```bash
# Services not started
docker-compose up -d

# Wait for ready
sleep 30

# Check status
docker-compose ps
```

### Issue: "No beds available"
```bash
# Check bed inventory
sqlite3 afribok_local.db "SELECT * FROM beds WHERE status='available';"

# Seed more beds
python scripts/seed_db.py --beds 100
```

### Issue: "Authentication failed"
```bash
# Ensure token is in header
curl -H "Authorization: Bearer YOUR_TOKEN"

# Generate new token if expired
curl -X POST http://localhost:8000/auth/login
```

### Issue: "Sync not working"
```bash
# Check sync status
curl -X GET http://localhost:8000/api/v1/admin/sync-status

# Check queue
sqlite3 afribok_local.db "SELECT * FROM sync_queue LIMIT 10;"

# Force sync
curl -X POST http://localhost:8000/api/v1/admin/force-sync
```

---

## 📈 Performance Tips

### Database
1. Use indexes for frequent queries
2. Partition by hospital_id
3. Archive old audit logs quarterly
4. Use connection pooling (already configured: 20 base, 10 overflow)

### API
1. Enable gzip compression (already enabled)
2. Use Redis cache for predictions
3. Implement pagination for list endpoints
4. Use async endpoints (already done)

### Frontend
1. Lazy load components
2. Implement virtualization for long lists
3. Use Service Workers for offline
4. Cache API responses in IndexedDB

---

## 🔐 Security Checklist

Before deployment:
- [ ] Change default passwords in .env
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Set up monitoring (Sentry)
- [ ] Configure regular backups
- [ ] Review audit logs weekly
- [ ] Update dependencies regularly

---

## 📚 Project Layout

```
backend/
  ├── core/          - App config & setup
  ├── db/            - Models & connections
  ├── api/           - REST endpoints
  ├── services/      - Business logic
  ├── sync/          - Offline sync
  ├── security/      - Auth & RBAC
  ├── ml/            - Predictions
  ├── utils/         - Helpers & errors
  └── tests/         - Unit & integration tests

frontend/
  ├── src/
  │   ├── components/   - React components
  │   ├── pages/        - Pages/routes
  │   ├── services/     - API & sync
  │   └── hooks/        - Custom hooks
  └── public/

docker/
  ├── Dockerfile.backend
  ├── docker-compose.yml
  └── nginx.conf

scripts/
  ├── setup_db.sh   - Init database
  └── seed_db.py    - Test data

docs/
  ├── ARCHITECTURE.md   - System design
  ├── DEPLOYMENT.md     - Deploy guide
  └── API.md            - API docs
```

---

## 📞 Quick Help

| Question | Answer |
|----------|--------|
| How do I start the system? | `docker-compose up -d` |
| Where are the logs? | `docker-compose logs -f backend` |
| How do I add a patient? | `POST /api/v1/patients/admit` |
| How do I get a token? | `POST /auth/login` |
| How is offline sync implemented? | SQLite locally, sync queue, auto-sync when online |
| Where is the database? | PostgreSQL on port 5432, SQLite locally |
| How do I test the API? | Use Swagger at http://localhost:8000/docs |
| What's the database schema? | See docs/DATABASE.md |
| How do predictions work? | Prophet+XGBoost ensemble (60/40 weights) |
| How do I deploy to production? | See docs/DEPLOYMENT.md |

---

**Last Updated**: March 17, 2026
**Version**: 2026.1.0
