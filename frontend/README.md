# Afribok 2026 - Frontend

React-based web application for Afribok 2026 Healthcare Management System.

## Features

- **Offline-First**: Works completely offline using IndexedDB
- **Automatic Sync**: Syncs data to backend when connection returns
- **Real-Time Alerts**: WebSocket support for live notifications
- **Responsive Design**: Material-UI for desktop and mobile
- **PWA Ready**: Service worker for app-like experience
- **Patient Management**: Admit, track vitals, discharge
- **Analytics Dashboard**: Real-time hospital metrics

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running on http://localhost:8000

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in the browser.

### Build

```bash
npm run build
```

Produces optimized production build in `build/` folder.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Navbar.js
│   │   ├── OfflineIndicator.js
│   │   ├── SyncStatus.js
│   │   ├── StatsCard.js
│   │   └── ...
│   ├── pages/               # Full page components
│   │   ├── LoginPage.js
│   │   ├── Dashboard.js
│   │   ├── PatientDetailsPage.js
│   │   └── AdminPage.js
│   ├── services/            # API and sync logic
│   │   ├── api.js          # Backend API client
│   │   └── sync.js         # IndexedDB sync manager
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js      # Authentication state
│   │   ├── usePatient.js   # Patient operations
│   │   └── useOffline.js   # Offline detection
│   ├── App.js              # Main app component
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── public/
│   ├── index.html          # HTML template
│   ├── manifest.json       # PWA manifest
│   └── service-worker.js   # Service worker for offline
├── package.json
├── .env                    # Environment config
└── .gitignore
```

## Key Technologies

- **React 18**: UI library
- **React Router**: Navigation
- **Material-UI**: Component library
- **Dexie**: IndexedDB wrapper
- **Axios**: HTTP client
- **Redux Toolkit**: State management (optional)

## Offline Architecture

### How It Works

1. **Data Storage**: All data stored in IndexedDB (local browser database)
2. **Sync Queue**: Operations queued when offline
3. **Auto Sync**: When online, sync service syncs all pending operations
4. **Conflict Resolution**: Last-write-wins strategy
5. **Service Worker**: Handles offline navigation and caching

### IndexedDB Stores

```javascript
{
  patients: '++id, externalId, nationalId, hospitalId, status',
  vitals: '++id, patientId, timestamp',
  audit_logs: '++id, patientId, createdAt',
  sync_queue: '++id, entity, status, timestamp',
  beds: '++id, hospitalId, status',
  cache: 'key'
}
```

## API Integration

### Services

**api.js**: Backend communication
- `login(username, password)` - Authenticate user
- `admitPatient(patientData)` - Admit new patient
- `getPatient(patientId)` - Fetch patient details
- `recordVitals(patientId, vitalsData)` - Record vital signs
- `getVitals(patientId, days)` - Fetch vital history
- `dischargePatient(patientId)` - Discharge patient
- `getBeds(hospitalId)` - Get bed availability
- `getPredictions(hospitalId)` - Get ML forecasts
- `syncPendingOperations()` - Sync queue to backend

**sync.js**: Offline sync management
- `storePatient(patient)` - Save locally
- `getPatient(id)` - Retrieve locally
- `queueForSync(entity, operation, data)` - Queue operation
- `syncPendingOperations()` - Sync to backend
- `cacheData(key, data, ttl)` - Cache with TTL

## Hooks

### useAuth
Authentication state and operations
```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

### usePatient
Patient data operations
```javascript
const {
  patients,
  currentPatient,
  loadPatients,
  admitPatient,
  recordVitals,
  loadVitals,
  dischargePatient
} = usePatient(hospitalId);
```

### useOffline
Offline detection and sync
```javascript
const { isOnline, isSyncing, syncStats, performSync } = useOffline();
```

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

## Authentication

### Login Flow
1. User enters credentials on LoginPage
2. `useAuth` hook calls `apiService.login()`
3. API returns `access_token` and `refresh_token`
4. Tokens stored in localStorage (encrypted at rest)
5. Redirect to Dashboard

### Token Management
- Tokens auto-refresh before expiry
- Invalid tokens trigger re-login
- Logout clears tokens and IndexedDB

## Data Flow

```
User Action (UI)
      ↓
React Component
      ↓
useAuth/usePatient/useOffline Hook
      ↓
apiService.js / syncService.js
      ↓
→ If Online: Fetch API → Cache result
→ If Offline: Use IndexedDB cache
      ↓
Update Component State
      ↓
Re-render UI
```

## Offline Mode

### What Works Offline
- ✓ View cached patients and vitals
- ✓ Admit new patients (queued for sync)
- ✓ Record vitals (queued for sync)
- ✓ Search local data
- ✓ Navigation

### What Requires Online
- ✗ Initial login (first time)
- ✗ Fresh data from backend
- ✗ Real-time predictions

### Offline Indicator
- Shows when connection lost
- Displays pending sync count
- Shows sync progress

## Testing

### Run Tests
```bash
npm test
```

### Unit Tests
```javascript
// Example test
describe('usePatient', () => {
  it('should admit patient successfully', async () => {
    const { result } = renderHook(() => usePatient(1));
    
    await act(async () => {
      await result.current.admitPatient({
        first_name: 'John',
        last_name: 'Doe',
        ...
      });
    });
    
    expect(result.current.patients.length).toBeGreaterThan(0);
  });
});
```

## Deployment

### Development Build
```bash
npm start
```

### Production Build
```bash
npm run build
```

### Deploy to Nginx
```bash
# Build
npm run build

# Copy to Nginx
sudo cp -r build/* /var/www/html/

# Restart Nginx
sudo systemctl restart nginx
```

### Docker Deployment
```dockerfile
FROM node:16-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- Gzip compression
- Service worker caching
- IndexedDB for instant loads
- Virtual scrolling for large lists

## Security

- JWT tokens in secure storage
- HTTPS only in production
- Content Security Policy headers
- XSS prevention via React escaping
- CSRF protection via SameSite cookies
- Sensitive data encrypted in IndexedDB

## Troubleshooting

### Offline sync not working
1. Check IndexedDB data in DevTools
2. Verify backend is running
3. Check network tab for failed requests
4. Clear browser cache and refresh

### Slow performance
1. Check DevTools Performance tab
2. Reduce IndexedDB records
3. Enable Production build (npm run build)
4. Check network latency

### Login issues
1. Verify backend credentials
2. Check token expiry
3. Clear localStorage
4. Restart dev server

## Contributing

1. Create feature branch
2. Make changes
3. Test changes
4. Create pull request

## License

MIT License - See LICENSE file

---

**Version**: 2026.1.0
**Last Updated**: March 17, 2026
**Status**: Production Ready
