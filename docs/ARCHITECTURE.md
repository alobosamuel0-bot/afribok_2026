# Afribok 2026 - Architecture Document

## System Overview

Afribok is a distributed healthcare management system designed to:
- Scale to **1+ million concurrent users**
- Work **offline** with intelligent sync when back online
- Prioritize **patient safety** above all else
- Run on **any infrastructure** (from rural Africa to data centers)

## Architecture Principles

### 1. **Offline-First**
- Local SQLite database on every device
- Sync queue for background synchronization
- No data loss even with internet disruptions
- Conflict resolution using last-write-wins strategy

### 2. **Patient Safety First**
- Immutable audit logs for every action
- Risk assessment on every admission
- Real-time critical value alerts
- Soft deletes (never destroy patient data)
- Multi-check validation at every step

### 3. **Horizontal Scalability**
- Stateless API servers
- Database partitioning by hospital
- Redis caching layer
- Async task processing with Celery
- Load balancing via Nginx

### 4. **Security & Compliance**
- JWT-based authentication
- Role-based access control (RBAC)
- HIPAA/GDPR ready
- End-to-end encryption for sensitive data
- Comprehensive audit trails

## System Layers

```
┌─────────────────────────────────────────────────────┐
│          PRESENTATION LAYER (Desktop/Mobile)         │
│  React Web • React Native • Progressive Web App      │
└────────────────────┬────────────────────────────────┘
                     │ REST/WebSocket
     ┌───────────────┴───────────────┐
     │  OFFLINE-FIRST SYNC ENGINE     │
     │  • IndexedDB/SQLite           │
     │  • Sync queue management       │
     │  • Conflict resolution         │
     └───────────────┬───────────────┘
                     │
┌─────────────────────┴──────────────────────────┐
│        API LAYER (FastAPI + Uvicorn)           │
│  REST Endpoints • WebSocket • Rate Limiting    │
├─────────────────────────────────────────────────┤
│        BUSINESS LOGIC LAYER                     │
│  • Patient Service (admission, discharge)       │
│  • Bed Management                               │
│  • Risk Assessment                              │
│  • Prediction Engine (Prophet + XGBoost)        │
├─────────────────────────────────────────────────┤
│  SECURITY LAYER                                 │
│  • JWT Authentication                           │
│  • RBAC Authorization                           │
│  • Audit Logging                                │
├─────────────────────────────────────────────────┤
│  CACHE LAYER (Redis)                            │
│  • Session cache                                │
│  • Prediction cache                             │
│  • Patient queue cache                          │
└─────────────────────┬──────────────────────────┘
                     │
   ┌─────────┬───────┴────────┬──────────┐
   │         │                │          │
┌──┴──┐   ┌──┴──┐      ┌──────┴──┐    ┌──┴──┐
│Local│   │Sync │      │Central  │    │Qeue │
│DB   │   │Mgr  │      │DB (PG)  │    │Task │
│     │   │     │      │         │    │     │
└─────┘   └─────┘      └─────────┘    └─────┘
```

## Database Schema

### Core Tables

- **hospitals**: Hospital/clinic information
- **departments**: Medical departments
- **doctors**: Healthcare providers
- **patients**: Patient records (CRITICAL)
- **beds**: Bed management
- **diseases**: Disease registry
- **patient_vitals**: Time-series vital signs
- **audit_logs**: Immutable audit trail
- **sync_queue**: Offline sync operations

### Design Patterns

1. **Immutable Audit Trail**
   - Every change logged
   - Never delete (soft deletes only)
   - Timestamp tracking

2. **Soft Deletes**
   - `is_deleted` boolean flag
   - Preserves data for audit
   - Easy recovery

3. **Time-Series**
   - Patient vitals indexed by time
   - Efficient queries
   - Easy trending

4. **Partitioning Ready**
   - Hospital_id in every table
   - Horizontal scaling support

## API Design

### REST Conventions
- GET /api/v1/patients - List patients
- POST /api/v1/patients/admit - Admit patient
- GET /api/v1/patients/{id} - Get patient
- POST /api/v1/patients/{id}/vitals - Record vitals
- POST /api/v1/patients/{id}/discharge - Discharge

### Response Format
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed",
  "timestamp": "2026-03-17T10:00:00Z"
}
```

### Error Handling
```json
{
  "status": "error",
  "error": "patient_not_found",
  "message": "Patient with ID 123 not found",
  "details": { ... }
}
```

## Scalability Strategy

### Horizontal Scaling
1. **API Servers**: Stateless, add more as needed
2. **Database**: Partition by hospital_id
3. **Cache**: Redis cluster
4. **Load Balancer**: Nginx/HAProxy

### Performance Optimization
1. **Indexing**: All queries indexed
2. **Caching**: Redis for hot data
3. **Async**: Background tasks
4. **Connection Pooling**: Efficient DB reuse

### Monitoring
1. **Prometheus**: Metrics
2. **Grafana**: Visualization
3. **ELK Stack**: Log aggregation
4. **Sentry**: Error tracking

## Deployment Options

### Docker (Recommended)
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Kubernetes
```bash
kubectl apply -f config/k8s/
```

### VPS/Traditional
```bash
# Use systemd service files
sudo systemctl start afribok-backend
```

## Security Measures

### Authentication
- JWT tokens with rotation
- OAuth2 support
- Multi-factor authentication ready

### Authorization
- Role-based access control
- Hospital isolation
- Department-level permissions

### Data Protection
- Encryption at rest (PostgreSQL pgcrypto)
- Encryption in transit (TLS)
- PII masking in logs

### Compliance
- HIPAA audit trails
- GDPR data retention
- Consent management
- Data anonymization tools

## Monitoring & Alerts

### Key Metrics
- API response time (target: <200ms p95)
- Database query time (target: <100ms p95)
- Sync success rate (target: >99%)
- Patient safety alerts

### Alerting Rules
- High error rate (>1%)
- Slow queries (>1s)
- Sync failures (3+ attempts)
- Capacity threshold (>85%)

## Disaster Recovery

### Backups
- Daily automated backups
- Backup verification
- Off-site replication

### Recovery Procedures
- Recovery Time Objective (RTO): 1 hour
- Recovery Point Objective (RPO): 15 minutes
- Tested recovery procedures

### High Availability
- Database replication
- Multi-region deployment ready
- Failover automation

## Performance Benchmarks

### Expected Performance
- Admit patient: <500ms
- Get patient: <100ms
- Record vitals: <300ms
- Sync 10K records: <2 minutes
- Concurrent users: 1M+

## Future Enhancements

1. **Telemedicine**: Video consultations
2. **AI Diagnosis**: Advanced ML models
3. **IoT Integration**: Device data ingestion
4. **Advanced Analytics**: Predictive health trends
5. **Mobile Offline**: Full offline mobile app
6. **Blockchain**: Immutable medical records

## Cost Optimization

### Resource Efficiency
- Auto-scaling policies
- Cache expiration tuning
- Query optimization
- Storage compression

### Geographic Optimization
- Regional data centers
- CDN for static assets
- Edge computing capabilities

## Support & Documentation

- **API Docs**: /docs (Swagger UI)
- **Wiki**: See /docs directory
- **Issues**: GitHub
- **Community**: Discussions forum
