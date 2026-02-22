-- ============================================================
-- GetMait Dashboard — Initial Schema + RLS
-- ============================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  phone      TEXT,
  email      TEXT,
  plan       TEXT        NOT NULL DEFAULT 'starter'
                         CHECK (plan IN ('starter', 'pro', 'enterprise')),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own tenant
CREATE POLICY "tenant_users_can_read_own_tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Owners can update their own tenant
CREATE POLICY "owners_can_update_tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================

-- TENANT_USERS
CREATE TABLE IF NOT EXISTS tenant_users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'staff'
                         CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_user_id   ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_tenant_user"
  ON tenant_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name   TEXT        NOT NULL,
  customer_phone  TEXT        NOT NULL,
  items           JSONB       NOT NULL DEFAULT '[]',
  total           NUMERIC     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  channel         TEXT        NOT NULL DEFAULT 'chat'
                              CHECK (channel IN ('voice', 'chat')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant_id  ON orders(tenant_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status     ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_users_can_read_own_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_users_can_insert_orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_users_can_update_own_orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================

-- SMS_CAMPAIGNS
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  message        TEXT        NOT NULL,
  sent_to_count  INT         NOT NULL DEFAULT 0,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_campaigns_tenant_id ON sms_campaigns(tenant_id);

ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_users_can_read_own_campaigns"
  ON sms_campaigns FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_users_can_insert_campaigns"
  ON sms_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  phone          TEXT        NOT NULL,
  order_count    INT         NOT NULL DEFAULT 0,
  last_order_at  TIMESTAMPTZ,
  opted_in_sms   BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, phone)
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_phone     ON customers(phone);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_users_can_read_own_customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_users_can_insert_customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_users_can_update_own_customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
