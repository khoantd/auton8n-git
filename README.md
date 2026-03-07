# Auton8n (Workflow Canvas)

A curated **workflow automation marketplace** with a focus on **AI Agents** for [n8n](https://n8n.io/). Browse, purchase, and download workflow templates—including LLM-powered agents—and visualize them with the n8n-demo component.

## Features

- **Workflow gallery** — Search and filter workflows by category (e.g. AI), view details, and download JSON templates for n8n
- **N8N workflow visualization** — Interactive workflow graphs via `@n8n_io/n8n-demo-component` (see [N8N_WORKFLOW_INTEGRATION.md](N8N_WORKFLOW_INTEGRATION.md))
- **Payments** — PayPal (Orders + Subscriptions) and manual QR flow; transactions and purchased workflows stored in Supabase
- **Purchases & subscriptions** — Owned workflows, subscription plans, and post-checkout download (see [docs/post-checkout-download-spec.md](docs/post-checkout-download-spec.md))
- **Admin** — Workflow management, carousel/slides, system settings, documents, activity logs

## Tech stack

| Layer    | Stack |
|----------|--------|
| Frontend | Vite, React 18, TypeScript, shadcn/ui, TailwindCSS, React Query |
| Database | Supabase (PostgreSQL); app tables in schema **`app`** |
| Payments | PayPal Orders + Subscriptions API, webhook verification |

## Getting started

### Prerequisites

- Node.js (LTS)
- Supabase project
- (Optional) PayPal app for payments

### Install and run

```bash
npm install
# Create .env (and backend/.env if using backend) with required vars — see Environment variables below
```

**Frontend only (Vite dev server):**

```bash
npm run dev
```

**Backend only (Express on port 4000):**

```bash
npm run dev:server
```

**Frontend + backend together:**

```bash
npm run dev:full
```

### Environment variables

**Frontend** (e.g. in `.env`, prefixed with `VITE_` for Vite):

- `VITE_SUPABASE_URL` — Supabase project URL  
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key  
- `VITE_PAYPAL_CLIENT_ID` — PayPal client ID (optional, for PayPal UI)  
- `VITE_API_BASE_URL` — Backend base URL (e.g. `http://localhost:4000`)


## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:server` | Start Express backend (tsx watch) |
| `npm run dev:full` | Run frontend and backend concurrently |
| `npm run build` | Production Vite build |
| `npm run preview` | Preview production build |
| `npm run seed:workflow-demo` | Seed demo workflow data |
| `npm run seed:workflows-remote` | Seed workflows from remote source |
| `npm run seed:payment-methods-remote` | Seed payment methods from remote |

## Contributing

1. Add or update workflow definitions in the data layer (e.g. workflows seeded via scripts or admin).
2. For AI/agent workflows, use category **AI** and document integrations (OpenAI, webhooks, HTTP, etc.).
3. Follow existing patterns for payments, Supabase schema `app`, and backend API.

---

**License:** See repository license file.
