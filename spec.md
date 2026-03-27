# Infinexy Solution

## Current State
All data (admin password, executives, profit records) is stored in browser localStorage. This means data is device-specific -- logging in from a different device shows no records and uses the default password, even if changed on another device.

## Requested Changes (Diff)

### Add
- Backend Motoko canister with full persistent storage for: admin password, executives (name/username/password), profit records
- Backend session management: login returns a token, token validated on each operation
- All CRUD operations for records and executives exposed as backend update/query calls
- Frontend API layer that calls the backend instead of localStorage

### Modify
- `storage.ts` → replace localStorage logic with backend canister calls
- `LoginPage.tsx` → call backend `login()` instead of local check
- `AdminDashboard.tsx` → fetch records/executives from backend; all mutations go to backend
- `ExecutiveDashboard.tsx` → fetch/add records from backend
- Session token stored in localStorage for persistence, but all data lives in backend

### Remove
- localStorage-based data storage for records, executives, and admin password (keep only session token in localStorage)

## Implementation Plan
1. Generate Motoko backend with: login, logout, listExecutives, addExecutive, deleteExecutive, changeExecutivePassword, changeAdminPassword, listAllRecords, listRecordsByMonth, addRecord, updateRecord, deleteRecord
2. Rewrite `src/frontend/src/lib/storage.ts` to be an async API layer calling backend actor
3. Update all three page components to use async backend calls
4. Keep session token in localStorage for page refresh persistence; validate against backend on load
