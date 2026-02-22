# GetMait Dashboard

Multi-tenant dashboard for GetMait — AI-Employee-as-a-Service for pizzerias.

**Live:** `dashboard.getmait.dk/:tenant_slug`
**Tech:** Next.js 14 · Supabase · Tailwind CSS · shadcn/ui · TypeScript

---

## 1. Local Development

```bash
git clone https://github.com/simongrevang/getmait-dashboard.git
cd getmait-dashboard
npm install
cp .env.stage .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
# → http://localhost:3000
```

---

## 2. Add a New Tenant

1. **Run migration** (once):
   ```bash
   docker exec supabase-db-<id> psql -U supabase_admin -d postgres \
     -f supabase/migrations/001_initial_schema.sql
   ```

2. **Insert tenant:**
   ```sql
   INSERT INTO tenants (slug, name, phone, email, plan)
   VALUES ('milano', 'Milano Pizza', '+4512345678', 'hej@milano.dk', 'starter');
   ```

3. **Create auth user** via Supabase Dashboard → Authentication → Invite.

4. **Link user to tenant:**
   ```sql
   INSERT INTO tenant_users (tenant_id, user_id, role)
   VALUES (
     (SELECT id FROM tenants WHERE slug = 'milano'),
     '<auth_user_uuid>',
     'owner'
   );
   ```

5. Dashboard: `dashboard.getmait.dk/milano/dashboard`

---

## 3. Coolify Deploy Flow

### Stage
- GitHub repo → branch: `staging`
- Domain: `dashboard-staging.getmait.dk`
- Env vars fra `.env.stage`

### Production
- GitHub repo → branch: `main`
- Domain: `dashboard.getmait.dk`
- Env vars fra `.env.production`

Projektet bruger `output: 'standalone'` — `Dockerfile` håndterer multi-stage build.

---

## 4. RLS Policy Overview

| Tabel | anon | authenticated |
|-------|------|---------------|
| `tenants` | ✗ | SELECT eget tenant · owners kan UPDATE |
| `tenant_users` | ✗ | SELECT egen række |
| `orders` | ✗ | SELECT / INSERT / UPDATE eget tenant |
| `sms_campaigns` | ✗ | SELECT / INSERT eget tenant |
| `customers` | ✗ | SELECT / INSERT / UPDATE eget tenant |

Alle policies bruger subquery på `tenant_users` til at verificere `auth.uid()`.

---

## 5. File Structure

```
app/
  [tenant_slug]/
    dashboard/     KPI + chart overview
    orders/        Bestillingsliste med statusfilter
    customers/     Kundeklub
    sms/           SMS-kampagner
    settings/      Butiksindstillinger
  login/           Login (auto-redirect til tenant)

components/
  layout/          Sidebar + TopBar
  dashboard/       KpiCard + OrdersChart
  orders/          OrderTable + OrderStatusBadge
  sms/             SmsComposer

lib/
  supabase/        client.ts + server.ts
  hooks/           useTenant · useOrders · useCustomers
  types/           TypeScript interfaces

middleware.ts      Auth guard + tenant ownership check
supabase/migrations/001_initial_schema.sql
```
