CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS funds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  vintage_year    INTEGER NOT NULL CHECK (vintage_year >= 1900 AND vintage_year <= 2100),
  target_size_usd NUMERIC(18, 2) NOT NULL CHECK (target_size_usd > 0),
  status          VARCHAR(50) NOT NULL CHECK (status IN ('Fundraising', 'Investing', 'Closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  investor_type VARCHAR(50) NOT NULL CHECK (investor_type IN ('Individual', 'Institution', 'Family Office')),
  email         VARCHAR(255) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id         UUID NOT NULL REFERENCES funds(id),
  investor_id     UUID NOT NULL REFERENCES investors(id),
  amount_usd      NUMERIC(18, 2) NOT NULL CHECK (amount_usd > 0),
  investment_date DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_fund_id ON investments(fund_id);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id         UUID NOT NULL REFERENCES funds(id),
  amount          NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  fee_percentage  NUMERIC(5, 4) NOT NULL CHECK (fee_percentage >= 0),
  calculated_fees NUMERIC(18, 2) NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'reversed')),
  reversed_at     TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_fund_id ON transactions(fund_id);