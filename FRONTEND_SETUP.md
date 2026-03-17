# Frontend Setup & Development Guide

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Backend API running (`http://localhost:8000`)

### Installation

```bash
# Navigate to frontend directory
cd c:\Users\USEDME\afribok_2026\frontend

# Install dependencies
npm install
```

### Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

Creates optimized production build in `frontend/build/` folder.

---

## Component Architecture

### Pages (Full Screen Components)

#### LoginPage
- User authentication
- Demo credentials display
- Form validation
- Error handling

**Location**: `src/pages/LoginPage.js`
**Features**:
- Username/password login
- Remember me option
- Demo account info
- Beautiful gradient background

#### Dashboard
- Patient overview
- Statistics cards
- Patient list table
- Admit new patient dialog
- Real-time sync status

**Location**: `src/pages/Dashboard.js`
**Features**:
- Quick stats (Total, Admitted Today, Critical, Available Beds)
- Sortable patient table with risk scores
- Color-coded patient status
- Quick patient admit form
- Refresh button with loading state

#### PatientDetailsPage
- Individual patient information
- Vital signs history
- Record new vitals
- Discharge functionality

**Location**: `src/pages/PatientDetailsPage.js`
**Features**:
- Patient demographics
- Admission details
- Vital signs table
- Record vitals form
- Discharge button

#### AdminPage
- System administration
- Audit logs viewer
- Sync status monitoring

**Location**: `src/pages/AdminPage.js`
**Features**:
- Tabbed interface
- Audit log history
- Entity sync statistics
- Failed operation count

### Components (Reusable)

#### Navbar
- Top navigation bar
- Online/offline status indicator
- User menu with logout

**Location**: `src/components/Navbar.js`
**Props**:
- `user`: Current user object
- `onLogout`: Logout callback
- `isOnline`: Connection status

#### OfflineIndicator
- Fixed alert when offline
- Informs user of offline mode
- Appears at top of screen

**Location**: `src/components/OfflineIndicator.js`

#### SyncStatus
- Modal showing sync progress
- Statistics (pending, synced, failed)
- Progress bar

**Location**: `src/components/SyncStatus.js`
**Props**:
- `stats`: Sync statistics
- `onClose`: Close callback

#### StatsCard
- Displays single metric
- Icon, title, value
- Color-coded backgrounds

**Location**: `src/components/StatsCard.js`
**Props**:
- `title`: Card title
- `value`: Numeric value
- `icon`: React icon
- `color`: 'primary', 'success', 'error', 'warning', 'info'

### Hooks (Reusable Logic)

#### useAuth
Manages authentication state

```javascript
const { user, isAuthenticated, login, logout, checkPermission } = useAuth();
```

**Features**:
- Login/logout
- Token management
- Permission checking
- Auto-refresh on mount

**Location**: `src/hooks/useAuth.js`

#### usePatient
Manages patient data operations

```javascript
const {
  patients,
  currentPatient,
  loading,
  error,
  loadPatients,
  loadPatient,
  admitPatient,
  recordVitals,
  dischargePatient,
  loadVitals,
  loadBeds,
  loadPredictions
} = usePatient(hospitalId);
```

**Features**:
- Load patients list
- Load individual patient
- Admit new patient
- Record vitals
- Discharge patient
- Fetch predictions

**Location**: `src/hooks/usePatient.js`

#### useOffline
Manages offline status and syncing

```javascript
const { isOnline, isSyncing, syncStats, performSync, getOfflineStats } = useOffline();
```

**Features**:
- Detect online/offline
- Show sync status
- Trigger sync
- Background sync interval

**Location**: `src/hooks/useOffline.js`

### Services (Data Layer)

#### apiService
Backend API client with offline fallback

```javascript
// Authentication
await apiService.login(username, password);
await apiService.logout();

// Patients
await apiService.admitPatient(patientData);
await apiService.getPatient(patientId);
await apiService.getPatients(hospitalId, filters);
await apiService.dischargePatient(patientId);

// Vitals
await apiService.recordVitals(patientId, vitalsData);
await apiService.getVitals(patientId, days);

// Resources
await apiService.getBeds(hospitalId);
await apiService.getPredictions(hospitalId);

// Sync
await apiService.syncPendingOperations();
```

**Location**: `src/services/api.js`
**Features**:
- Automatic retry logic
- Offline fallback to IndexedDB
- Token refresh
- Response caching
- Error handling

#### syncService
IndexedDB offline sync management

```javascript
// Store data
await syncService.storePatient(patient);
await syncService.storeVitals(patientId, vitals);

// Retrieve data
await syncService.getPatient(patientId);
await syncService.getPatientVitals(patientId, days);
await syncService.getAllPatients(hospitalId);

// Sync queue
await syncService.queueForSync(entity, operation, data);
await syncService.getPendingOperations();
await syncService.markAsSynced(operationId);

// Cache
await syncService.cacheData(key, data, ttlMinutes);
await syncService.getCachedData(key);

// Stats
await syncService.getStats();
```

**Location**: `src/services/sync.js`
**Features**:
- IndexedDB persistence
- Batch operations
- TTL caching
- Conflict detection
- Database statistics

---

## State Management

### Current Approach: React Hooks
- `useAuth` for global auth state
- `usePatient` for patient operations
- `useOffline` for sync state
- Local component state with `useState`

### Optional: Redux (Future)
For more complex state, can add Redux:
```bash
npm install redux react-redux @reduxjs/toolkit
```

---

## Offline-First Workflow

### Offline Example

```
1. User goes offline (no internet)
   ↓
2. User tries to admit patient
   ↓
3. admitPatient() queues data in IndexedDB
   ↓
4. OfflineIndicator shows "Offline" message
   ↓
5. User continues working, admits 5 more patients
   ↓
6. SyncStatus shows "5 pending operations"
   ↓
7. Internet returns
   ↓
8. Auto-sync starts, syncs all 6 operations
   ↓
9. SyncStatus updates: "6 synced"
   ↓
10. OfflineIndicator disappears
```

### Code Example

```javascript
// In Dashboard.js
const { isOnline, syncStats } = useOffline();
const { admitPatient } = usePatient(hospitalId);

const handleAdmit = async (patientData) => {
  try {
    const result = await admitPatient(patientData);
    
    if (result.offline) {
      // Show: "Patient saved locally, will sync when online"
    } else {
      // Show: "Patient admitted successfully"
    }
  } catch (error) {
    // Handle error
  }
};
```

---

## Authentication Flow

### Login

```
1. User enters credentials on LoginPage
   ↓
2. Click Sign In button
   ↓
3. useAuth.login(username, password) called
   ↓
4. Axios POST to /auth/login
   ↓
5. Backend returns access_token + refresh_token
   ↓
6. Tokens stored in localStorage
   ↓
7. User data stored in localStorage
   ↓
8. Navigate to /dashboard
```

### Token Headers

All API requests automatically include:
```
Authorization: Bearer ACCESS_TOKEN
```

### Token Refresh

```
1. Request returns 401 Unauthorized
   ↓
2. Interceptor catches error
   ↓
3. POST to /auth/refresh with refresh_token
   ↓
4. Backend returns new access_token
   ↓
5. Retry original request
   ↓
6. If refresh fails → logout + redirect to login
```

---

## Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

Access in code:
```javascript
const apiUrl = process.env.REACT_APP_API_URL;
```

---

## Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.js           - Top navigation
│   │   ├── OfflineIndicator.js - Offline banner
│   │   ├── SyncStatus.js       - Sync progress modal
│   │   └── StatsCard.js        - Stat display card
│   │
│   ├── pages/
│   │   ├── LoginPage.js        - Login screen
│   │   ├── Dashboard.js        - Main dashboard
│   │   ├── PatientDetailsPage.js - Patient view
│   │   └── AdminPage.js        - Admin panel
│   │
│   ├── hooks/
│   │   ├── useAuth.js          - Auth logic
│   │   ├── usePatient.js       - Patient operations
│   │   └── useOffline.js       - Offline detection
│   │
│   ├── services/
│   │   ├── api.js              - Backend client
│   │   └── sync.js             - IndexedDB sync
│   │
│   ├── App.js                  - Main app + routing
│   ├── index.js                - Entry point
│   └── index.css               - Global styles
│
├── public/
│   ├── index.html              - HTML template
│   ├── manifest.json           - PWA config
│   └── service-worker.js       - Offline support
│
├── package.json
├── .env                        - Environment vars
└── README.md                   - Frontend readme
```

---

## Common Tasks

### Add New Patient Field

1. **Update API request** (`src/services/api.js`):
```javascript
async admitPatient(patientData) {
  // patientData should include new field
}
```

2. **Update form** (`src/pages/Dashboard.js`):
```javascript
const [formData, setFormData] = useState({
  // ... existing fields
  newField: ''
});
```

3. **Add to IndexedDB store** (`src/services/sync.js`):
```javascript
// In storePatient()
// Will automatically sync to backend
```

### Add New Component

1. Create file: `src/components/MyComponent.js`
2. Import and use in page
3. Pass data via props

### Add New Page

1. Create file: `src/pages/MyPage.js`
2. Add route in `App.js`:
```javascript
<Route
  path="/my-page"
  element={<ProtectedRoute element={<MyPage />} isAuthenticated={isAuthenticated} />}
/>
```

### Handle Errors

```javascript
const { error, loading } = usePatient();

if (error) {
  return <Alert severity="error">{error.message}</Alert>;
}
```

---

## Browser DevTools

### View IndexedDB
1. Open DevTools (F12)
2. Application tab → IndexedDB → AfribokDB
3. Inspect stores: patients, vitals, sync_queue, cache

### View Service Worker
1. Application tab → Service Workers
2. See registration and status
3. Check Network tab to verify caching

### View Local Storage
1. Application tab → Local Storage → http://localhost:3000
2. See: `accessToken`, `refreshToken`, `userData`

---

## Next Steps

1. ✅ Frontend structure created
2. ✅ All components built
3. ⏳ Connect to running backend API
4. ⏳ Test offline functionality
5. ⏳ Test patient workflows
6. ⏳ Load test with 1M+ users data
7. ⏳ Deploy to production

---

## Quick Reference

### Start Development
```bash
cd frontend
npm install
npm start
```

### Build Production
```bash
npm run build
```

### Testing
```bash
npm test
```

### Troubleshooting

**Port 3000 already in use**
```bash
npm start -- --port 3001
```

**Clear npm cache**
```bash
npm cache clean --force
```

**Reinstall dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Version**: 2026.1.0
**Last Updated**: March 17, 2026
**Status**: ✅ Ready to Run
