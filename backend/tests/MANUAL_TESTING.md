# Manual Testing Checklist - NAWI Verification Suite

Follow this checklist to manually verify application flow, user roles, security actions, data persistence, and report validation criteria.

## 🔑 Authentication Flows
- [ ] **Register User**: Go to `/login` (or `/register` toggler), enter credentials, verify email validation and password complexity constraint alerts.
- [ ] **Login Inspector**: Log in using standard inspector details. Ensure the dashboard redirect matches and loads `/verification`.
- [ ] **Login Admin**: Log in using whitelisted admin details (`ilmchikhli@gmail.com`). Verify redirect mounts administrative navigation options and `/admin/dashboard`.
- [ ] **Logout**: Click the logout button. Verify local storage (`nawi_auth_token`, etc.) clears out, session data resets, and browser redirects to `/login`.

## ⚖️ Instrument Verification Suite
- [ ] **Create New Report**: Choose "Create Report" to load a blank parameters layout. Ensure forms are initialized empty.
- [ ] **Step Wizard Complete**: Navigate steps 1 to 11. Ensure validation thresholds check (e.g. MPE margins in Step 5 Accuracy, off-center weights check in Step 7 Eccentricity).
- [ ] **Page Refresh Recovery**: Fill parameters up to Step 5, refresh the browser page. Confirm that the application recovers the state automatically.
- [ ] **Auto-Save Verification**: Fill fields on any step and wait 3 seconds. Verify database saves draft properties and indicates successful save.
- [ ] **Final Report Submission**: Complete all steps and submit. Confirm Certificate number (`CERT-YYYY-XXX`) is successfully generated.

## 📄 Document Export
- [ ] **PDF Generation**: Click "Print Certificate" or "Export PDF". Verify the browser streams and downloads `NAWI_Report_REP-XXXX-XXX.pdf` with correct data styles.
- [ ] **JSON Export/Import**: Choose "Export Data". Confirm data downloads as a JSON document and parses correctly on import reset.

## 🛡️ Administrative Portal
- [ ] **Security Block check**: Log in as a normal inspector and attempt to navigate directly to `/admin/dashboard`. Verify it redirects to `/verification` (403 guard check).
- [ ] **Dashboard Aggregates**: Open `/admin/dashboard`. Ensure summary cards, accuracy class pie chart, and verdict bar charts render correct numbers.
- [ ] **Reports Index Search**: Filter list by status, date limits, and inspector. Search client names and verify details lookups.
- [ ] **Edit Report Fields**: Select "Edit" on a report. Modify fields, save changes, and confirm `modification_history` appends the change trace entries.
