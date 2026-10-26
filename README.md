# ReviewFlow Super Admin Portal (`mtrs/superadmin`)

An enterprise-grade, security-hardened Super Admin control panel for ReviewFlow SaaS platform operators. Built as an independent Next.js application strictly separated from the customer-facing frontend.

---

## 1. Architecture & Port Separation

| Application | Port | Directory | Framework / Runtime | Purpose |
|---|---|---|---|---|
| **Backend API** | `5050` | `mtrs/backend` | Node.js, Express, TypeScript, MongoDB | Authoritative platform API & security boundary |
| **Customer Frontend** | `3000` | `mtrs/frontend` | Next.js App Router, React 19, Tailwind CSS | Business owners & customer reviews |
| **Super Admin Portal** | `3001` | `mtrs/superadmin` | Next.js App Router, React 19, Tailwind CSS | Privileged platform control & governance |

The Super Admin application operates on port **3001** to avoid collision with the customer application (`3000`).

---

## 2. Environment Configuration

Create `.env.local` inside `mtrs/superadmin`:

```env
# ReviewFlow Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5050/api/v1
PORT=3001
```

> **Security Guardrail:** Never place database connection strings, Razorpay private keys, webhook secrets, or session secrets inside `NEXT_PUBLIC_*` variables. Private credentials reside solely on the backend server.

---

## 3. Super Admin Authentication & Provisioning

### Controlled Server-Side Bootstrap (No Public Signup)
In accordance with enterprise zero-trust security:
- **No public Super Admin signup endpoint exists.**
- **No default shared passwords or backdoors.**
- Privileged administrators are provisioned via the controlled CLI script executed directly in the backend environment:

```bash
# In mtrs/backend:
npx tsx src/scripts/seed-admin.ts --email=admin@reviewflow.com --name="Platform Administrator"
```

The script is idempotent and repeat-safe. It elevates an existing user or creates a verified administrator without outputting sensitive tokens, passwords, or OTP secrets to logs.

### Administrator Authentication Flow
1. Navigate to `http://localhost:3001/login`.
2. Input the provisioned admin email.
3. The backend generates a cryptographically hashed OTP dispatched via email.
4. Input the 6-digit OTP code to verify and establish an HTTP-only secure session cookie.
5. Client-side route protection guards internal views; server-side middleware independently enforces `super_admin` permissions on every single API request.

---

## 4. Security, Cookies & CSRF Architecture

1. **HTTP-Only Cookies (`session`):** The session identifier cannot be read or exfiltrated by clientside scripts (`httpOnly: true`, `sameSite: 'lax'`, `path: '/'`).
2. **Double-Submit CSRF Defense (`x-csrf-token`):** Every state-changing mutation (`POST`, `PUT`, `PATCH`, `DELETE`) reads the readable `csrf_token` cookie and sends it in the `x-csrf-token` request header, validated by backend middleware.
3. **CORS Isolation:** The backend explicitly authorizes `http://localhost:3001` in `CORS_ORIGIN` with `credentials: true`.
4. **No Browser Storage Tokens:** Session tokens are never saved to `localStorage` or `sessionStorage`.

---

## 5. Super Admin Platform Pages

| Route | Page | Purpose |
|---|---|---|
| `/login` | **Admin Login** | Secure OTP authentication for verified super admin emails |
| `/overview` | **System Dashboard** | Authoritative KPIs: business counts, active entitlements, gross revenue, recent activity |
| `/businesses` | **Business Management** | Paginated directory, search/filters, business drawer, audited suspension/reactivation |
| `/plans` | **Plans & Pricing** | Commercial plans (Monthly ₹99, 5-Month ₹399), creation/edit modal with pricing safeguards |
| `/promotions` | **FREE4YOU Lifecycle** | Lifecycle management (Active, Paused, Retired with 30-day grace period & migration) |
| `/subscriptions`| **Subscriptions** | Live entitlements, status/plan filtering, audited manual overrides with reasons |
| `/payments` | **Transactions** | Complete payment event audit trail (amount in INR, provider, references, simulation tags) |
| `/operations` | **Billing Operations**| Provider health monitoring, HMAC webhook verification status, ingestion event logs |
| `/audit-logs` | **Platform Audit Trail**| Searchable, filterable ledger of all privileged changes with metadata inspection |
| `/settings` | **Admin Settings** | Authenticated admin profile, security controls, provisioning documentation, logout |

---

## 6. Commercial Plans & FREE4YOU Lifecycle Rules

### Commercial Configuration
- **Monthly Plan:** ₹99/month (recurring billing only with explicit mandate consent).
- **Five-Month Package:** ₹399 for 5 calendar months (one-time payment, non-recurring).
- **Historical Price Immutability:** Changing a plan's price in this portal affects future purchases only; existing customer subscriptions preserve immutable historical price snapshots.

### FREE4YOU Promotion Lifecycle Business Rules
1. **Active:** Eligible customers can redeem `FREE4YOU` for lifetime-free platform access.
2. **Paused:**
   - Immediately blocks any new redemptions.
   - **Existing customer entitlements remain 100% active and untouched.** Pausing never revokes access from accounts that already redeemed the code.
3. **Retired / Withdrawn:**
   - Blocks new redemptions permanently.
   - Initiates an audited migration workflow with a configurable grace period (default 30 days).
   - Records the retirement reason, effective deadline, and affected accounts count.
   - Users are not automatically charged without consent.

---

## 7. Development & Verification Commands

All commands run independently inside `mtrs/superadmin`:

```bash
# 1. Start the Super Admin dev server on port 3001
npm run dev

# 2. Run unit and component tests (Vitest)
npm test

# 3. Type-check TypeScript
npm run typecheck

# 4. Lint code (ESLint 9)
npm run lint

# 5. Build production bundle (Turbopack)
npm run build

# 6. Start production server
npm run start
```
