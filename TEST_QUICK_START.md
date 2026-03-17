# Testing Quick Start Guide

**Status**: ✅ Complete testing infrastructure
**Version**: 2026.1.0

---

## 🚀 5-Minute Test Setup

### Backend Tests (60 seconds)

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
pytest

# Run with coverage report
pytest --cov=backend --cov-report=html

# Open coverage report
start htmlcov/index.html
```

**Expected Output**:
```
backend/tests/test_patient_service.py::TestPatientService::test_admit_patient_success PASSED
backend/tests/test_auth.py::TestAuthentication::test_create_access_token PASSED
backend/tests/test_sync.py::TestSyncManager::test_queue_operation PASSED
backend/tests/test_api.py::TestPatientEndpoints::test_admit_patient_endpoint PASSED

======================== 40+ passed in 2.50s ========================
```

### Frontend Tests (60 seconds)

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Run tests in watch mode
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

**Expected Output**:
```
PASS  src/hooks/useAuth.test.js (1.5s)
  useAuth Hook
    ✓ should initialize with unauthenticated state (25ms)
    ✓ should login user successfully (120ms)
    ✓ should logout user (50ms)
    ✓ should check permission (30ms)

PASS  src/services/api.test.js (2.1s)
  API Service
    ✓ should login user (50ms)
    ✓ should get patient (80ms)
    ✓ should record vitals (60ms)

PASS  src/components/Components.test.js (1.2s)
  LoginPage Component
    ✓ should render login form (45ms)
    ✓ should have submit button (30ms)

Test Suites: 4 passed, 4 total
Tests:       35 passed, 35 total
Coverage: 60-70%+
```

---

## 🔬 Detailed Test Breakdown

### Backend Tests by Module

#### 1. Patient Service Tests
```bash
pytest backend/tests/test_patient_service.py -v

# Individual tests
pytest backend/tests/test_patient_service.py::TestPatientService::test_admit_patient_success -v
pytest backend/tests/test_patient_service.py::TestPatientService::test_risk_score_calculation -v
pytest backend/tests/test_patient_service.py::TestPatientService::test_bed_allocation_priority -v
```

**Test Coverage**:
- ✓ Patient admission (duplicate prevention, risk scoring)
- ✓ Bed allocation (ICU/Regular/Buffer)
- ✓ Vital signs validation
- ✓ Patient discharge (audit trail)
- ✓ Data retrieval (single & list)

#### 2. Authentication Tests
```bash
pytest backend/tests/test_auth.py -v

# Individual test
pytest backend/tests/test_auth.py::TestAuthentication::test_create_access_token -v
pytest backend/tests/test_auth.py::TestAuthorization::test_check_permission_granted -v
```

**Test Coverage**:
- ✓ JWT token creation & expiration
- ✓ Role-based access control
- ✓ Permission checking
- ✓ Password hashing
- ✓ Session management

#### 3. Sync Manager Tests
```bash
pytest backend/tests/test_sync.py -v

# Individual tests
pytest backend/tests/test_sync.py::TestSyncManager::test_queue_operation -v
pytest backend/tests/test_sync.py::TestSyncManager::test_conflict_resolution_last_write_wins -v
```

**Test Coverage**:
- ✓ Operation queuing (offline)
- ✓ Batch sync processing
- ✓ Conflict resolution
- ✓ Retry logic
- ✓ Sync statistics

#### 4. API Endpoint Tests
```bash
pytest backend/tests/test_api.py -v

# Individual endpoint tests
pytest backend/tests/test_api.py::TestPatientEndpoints::test_admit_patient_endpoint -v
pytest backend/tests/test_api.py::TestErrorHandling::test_missing_auth_header -v
```

**Test Coverage**:
- ✓ All patient endpoints
- ✓ Authentication endpoints
- ✓ Error handling (401, 404, 422)
- ✓ Validation errors

### Frontend Tests by Module

#### 1. Auth Hook Tests
```bash
cd frontend
npm test -- useAuth.test.js

# Or run all hook tests
npm test -- hooks
```

**Test Coverage**:
- ✓ Login/logout functionality
- ✓ Permission checking
- ✓ Token persistence
- ✓ Authentication state

#### 2. Patient Hook Tests
```bash
npm test -- usePatient.test.js
```

**Test Coverage**:
- ✓ Load patients
- ✓ Admit patient
- ✓ Record vitals
- ✓ Discharge patient
- ✓ Error handling

#### 3. Offline Hook Tests
```bash
npm test -- useOffline.test.js
```

**Test Coverage**:
- ✓ Online/offline detection
- ✓ Sync triggering
- ✓ Offline statistics
- ✓ Background sync

#### 4. API Service Tests
```bash
npm test -- services/api.test.js
```

**Test Coverage**:
- ✓ Patient operations (admit, get, list)
- ✓ Vitals recording
- ✓ Offline fallback
- ✓ Error handling
- ✓ Caching

#### 5. Sync Service Tests
```bash
npm test -- services/sync.test.js
```

**Test Coverage**:
- ✓ Local storage (IndexedDB)
- ✓ Sync queue management
- ✓ Caching with TTL
- ✓ Data integrity
- ✓ Statistics

#### 6. Component Tests
```bash
npm test -- Components.test.js
```

**Test Coverage**:
- ✓ LoginPage rendering
- ✓ Dashboard functionality
- ✓ Navbar components
- ✓ OfflineIndicator behavior
- ✓ Responsive design

---

## 🔄 Integration Tests

### Full Stack Test (Backend + Frontend)

```bash
# Terminal 1: Start backend
cd backend
uvicorn core.app:app --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd frontend
npm start
# Opens browser at http://localhost:3000

# Terminal 3: Run integration tests
cd frontend
npm run test:ci

# Or with Docker
docker-compose up -d
```

### Test Offline-First Workflow

1. **Login**
   - Go to http://localhost:3000
   - Enter: demo@hospital.com / Demo@12345
   - Expected: Dashboard loads

2. **Go Offline** (DevTools → Network → Offline)
   - Click "Admit Patient"
   - Fill form and submit
   - Expected: Operation queued locally

3. **Record Vitals**
   - Go to patient details
   - Add vitals
   - Expected: Stored offline

4. **Go Online** (DevTools → Network → Online)
   - Expected: Auto-sync begins
   - SyncStatus shows progress
   - Operations synced to backend

---

## 📊 Coverage Reports

### Generate Backend Coverage

```bash
cd backend

# Generate coverage report
pytest --cov=backend --cov-report=html --cov-report=term-missing

# View report
start htmlcov/index.html
```

**Report Shows**:
- Lines covered: Green
- Lines missed: Red
- Coverage percentage by file
- Branch coverage
- Detailed line-by-line report

### Generate Frontend Coverage

```bash
cd frontend

# Generate coverage report
npm run test:coverage

# View report (opens automatically)
start coverage/lcov-report/index.html
```

**Report Shows**:
- Component coverage
- Hook coverage
- Service coverage
- Branch coverage
- Missing coverage details

---

## 🐛 Debugging Tests

### Backend Debug Mode

```bash
# Run with verbose output
pytest -vv

# Run with print statements
pytest -s

# Run specific test with debugging
pytest backend/tests/test_patient_service.py::TestPatientService::test_admit_patient_success -vv -s

# Run with pdb debugger
pytest --pdb

# Run with breakpoint
pytest --trace
```

### Frontend Debug Mode

```bash
# Run in debug mode
npm test -- --debug

# Run with verbose logging
npm test -- --verbose

# Run specific test
npm test -- useAuth.test.js --verbose

# Update snapshots
npm test -- -u
```

---

## 🔧 Test Configuration

### pytest.ini (Backend)

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    asyncio: async tests
    slow: slow tests
    integration: integration tests
```

### jest.config.js (Frontend)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
```

---

## 🎯 Common Test Commands

### Quick Tests

```bash
# Backend - fast tests only
pytest -m "not slow"

# Frontend - tests for specific component
npm test -- LoginPage

# Frontend - watch mode (re-run on file change)
npm test -- --watch
```

### Full Suite

```bash
# Backend - all tests with coverage
pytest --cov=backend --cov-report=html

# Frontend - all tests with coverage
npm run test:coverage

# Both with reporting
# Backend
pytest --cov=backend --cov-report=xml --cov-report=term-missing
# Frontend
npm run test:ci
```

### CI Mode

```bash
# Backend CI
pytest --cov=backend --cov-report=xml -v

# Frontend CI
npm run test:ci

# Both
# .github/workflows run these automatically
```

---

## ⚡ Performance Testing

### Load Testing Backend

```bash
# Install k6 or Apache JMeter
# Location: backend/tests/load/

# Or use simple load test
while true; do
  curl -X GET http://localhost:8000/api/v1/patients \
    -H "Authorization: Bearer TOKEN" &
done
```

### Performance Monitor Frontend

```bash
# Chrome DevTools
1. Open http://localhost:3000
2. F12 → Performance tab
3. Record and analyze

# Lighthouse
1. F12 → Lighthouse tab
2. Run audit
3. Check performance score
```

---

## 📈 Test Metrics to Monitor

### Backend Metrics
- **Line Coverage**: Target 70%+
- **Branch Coverage**: Target 60%+
- **Test Execution Time**: <5 seconds
- **Failed Tests**: 0

### Frontend Metrics
- **Line Coverage**: Target 60%+
- **Component Coverage**: Target 80%+
- **Test Execution Time**: <10 seconds
- **Failed Tests**: 0

---

## 🔗 GitHub Actions

### Automated Test Runs

Tests run automatically when:
1. Code pushed to main/develop
2. Pull request created
3. Scheduled nightly runs

**View Results**:
```
GitHub → Afribok Repository → Actions tab
→ Select workflow
→ View test results and coverage
```

### Local CI Simulation

```bash
# Install act (runs GitHub workflows locally)
# https://github.com/nektos/act

act -j test

# Or manually run workflow commands
pytest --cov=backend
npm run test:ci
```

---

## ✅ Test Checklist

Run these before deployment:

- [ ] Backend unit tests pass
- [ ] Backend coverage > 65%
- [ ] Frontend unit tests pass
- [ ] Frontend coverage > 55%
- [ ] Integration tests pass
- [ ] Offline-first workflow works
- [ ] Sync queuing and recovery works
- [ ] No console errors in browser
- [ ] No SQL errors in backend
- [ ] Health check endpoint works
- [ ] Docker build succeeds
- [ ] docker-compose up succeeds

---

## 🚨 Troubleshooting

### Backend Tests Failing

```bash
# Clear cache
pytest --cache-clear

# Recreate test database
rm backend/tests/.pytest_cache

# Check dependencies
pip install -r backend/requirements-test.txt

# Run with full output
pytest -vv -s
```

### Frontend Tests Failing

```bash
# Clear cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+

# Run with verbose
npm test -- --verbose
```

### Integration Tests Failing

```bash
# Ensure backend is running
curl http://localhost:8000/health

# Check frontend .env
cat frontend/.env

# Verify database connectivity
POSTGRES_URL=... psql -c "SELECT version();"

# Check Redis
redis-cli ping
```

---

## 📞 Support

**Need help?** Check:
1. [TESTING_AND_CICD.md](TESTING_AND_CICD.md) - Detailed test documentation
2. [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) - Project status
3. Test files themselves - They document expected behavior

**Common Issues**:
- Port already in use → Change port in .env
- Database connection fails → Check DATABASE_URL
- Tests timeout → Increase timeout value
- Flaky tests → Run multiple times with `-v` flag

---

**Testing Infrastructure Complete**
**Version**: 2026.1.0
**Status**: ✅ Production Ready

🎉 **Ready to run full test suite and deploy to production!**
