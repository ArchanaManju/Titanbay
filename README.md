# Titanbay Private Markets API

A RESTful backend service for managing private market funds, investors, and investments.

Built with **TypeScript**, **Node.js (Express)**, **PostgreSQL**, and **Docker**.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Type safety catches bugs at compile time, mirrors Titanbay's stack |
| Framework | Express | Minimal and battle-tested, easy to reason about |
| Database | PostgreSQL | ACID-compliant, exact NUMERIC types for financial data |
| Validation | Zod | TypeScript-native, structured error messages |
| Container | Docker | One command to run everything locally |

---

## Project Structure
```
src/
├── index.ts                           # Entry point — starts the server
├── routes/index.ts                    # Maps URLs to controller functions
├── controllers/
│   ├── funds.controller.ts            # Fund endpoints
│   ├── investors.controller.ts        # Investor endpoints
│   ├── investments.controller.ts      # Investment endpoints
│   └── transactions.controller.ts    # Transaction endpoints
├── middleware/
│   ├── errorHandler.ts                # Global error handling
│   └── validate.ts                    # Zod schemas + validation
├── db/
│   ├── pool.ts                        # PostgreSQL connection pool
│   └── schema.sql                     # Table definitions
└── types/
    └── index.ts                       # Shared TypeScript interfaces
```

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone the repository
```bash
git clone https://github.com/ArchanaManju/Titanbay.git
cd titanbay-api
```

### 2. Start everything
```bash
docker-compose up --build
```

This will:
- Start PostgreSQL and create all tables automatically
- Build and start the API

### 3. Verify it's working
```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Funds
| Method | Path | Description |
|--------|------|-------------|
| GET | `/funds` | List all funds |
| POST | `/funds` | Create a fund |
| PUT | `/funds` | Update a fund |
| GET | `/funds/:id` | Get a specific fund |
| GET | `/funds/:fund_id/total-value` | Get total value of a fund |

### Investors
| Method | Path | Description |
|--------|------|-------------|
| GET | `/investors` | List all investors |
| POST | `/investors` | Create an investor |

### Investments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/funds/:fund_id/investments` | List investments for a fund |
| POST | `/funds/:fund_id/investments` | Add an investment to a fund |

### Transactions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/transactions` | List all transactions |
| POST | `/transactions/process` | Process a transaction |
| PUT | `/transactions/:id/reverse` | Reverse a transaction |
| POST | `/admin/recalculate-fees` | Recalculate fees for a fund |

---

## Example Requests

### Create a Fund
```bash
curl -X POST http://localhost:3000/api/v1/funds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Titanbay Growth Fund I",
    "vintage_year": 2024,
    "target_size_usd": 250000000,
    "status": "Fundraising"
  }'
```

### Create an Investor
```bash
curl -X POST http://localhost:3000/api/v1/investors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CalPERS",
    "investor_type": "Institution",
    "email": "pe@calpers.ca.gov"
  }'
```

### Add an Investment
```bash
curl -X POST http://localhost:3000/api/v1/funds/<fund_id>/investments \
  -H "Content-Type: application/json" \
  -d '{
    "investor_id": "<investor_id>",
    "amount_usd": 50000000,
    "investment_date": "2024-03-15"
  }'
```

### Process a Transaction
```bash
curl -X POST http://localhost:3000/api/v1/transactions/process \
  -H "Content-Type: application/json" \
  -d '{
    "fund_id": "<fund_id>",
    "amount": 1000000,
    "fee_percentage": 2.5,
    "auto_calculate_fees": true
  }'
```

---

## Design Decisions

### 1. Parameterised SQL queries
All queries use `$1, $2` placeholders — never string interpolation. This prevents SQL injection attacks.

### 2. NUMERIC for all money columns
PostgreSQL `NUMERIC(18,2)` stores exact decimals. JavaScript floats can't represent money precisely — `0.1 + 0.2 = 0.30000000000000004`. We avoid this entirely.

### 3. Validation at the edge
Request bodies are validated with Zod before reaching controllers. Controllers can trust their inputs are always correct.

### 4. Foreign key constraints
The database enforces referential integrity independently of the application. You cannot create an investment pointing to a non-existent fund — even if someone queries the DB directly.

### 5. Centralised error handling
One error handler covers all 13 endpoints. Every error always returns the same JSON shape — no inconsistencies.

### 6. Connection pooling
One shared `pg.Pool` instance with 10 connections. Opening a new DB connection per request costs ~100ms — pooling keeps it under 1ms.

---

## Error Format

All errors return consistent JSON:
```json
{
  "error": {
    "message": "Fund with id 'abc' not found",
    "statusCode": 404
  }
}
```

| Status | When |
|--------|------|
| 400 | Validation failed |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, reversing a non-completed transaction) |
| 500 | Unexpected server error |

---

## How I Used AI Tools

Claude (Anthropic) was used throughout as a pair programmer:

- **Architecture** — folder structure and separation of concerns
- **Schema design** — NUMERIC vs FLOAT for financial data, CHECK constraints
- **Validation** — Zod schema design for each endpoint
- **SQL queries** — COALESCE for partial updates, CTE for bulk fee recalculation
- **Error handling** — consistent error middleware pattern

All key decisions were made with deliberate reasoning and understanding — AI accelerated the implementation, not the thinking.