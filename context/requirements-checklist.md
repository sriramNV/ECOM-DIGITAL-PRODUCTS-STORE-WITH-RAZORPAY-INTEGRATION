# Requirements Checklist — From Scratch to Completion

Everything you need to provide or set up on your end to complete this project, organized by phase.

---

## Phase 0 — Foundation Setup

### Development Environment

| Item | Details | When |
|------|---------|------|
| **Node.js 20+** | Install from https://nodejs.org | Before dev starts |
| **pnpm** | `npm install -g pnpm` | Before dev starts |
| **Docker Desktop** | Install from https://docker.com | Before dev starts |
| **GitHub account** | Create repo, set up SSH keys | Before dev starts |
| **VPS (production)** | Ubuntu 24.04, 2GB+ RAM, 2+ CPUs, 50GB+ SSD | Before deployment |
| **Domain name** | e.g., `podstore.com` | Before deployment |

### Accounts to Create

| Service | Purpose | URL | Free Tier? |
|---------|---------|-----|------------|
| **GitHub** | Source control, CI/CD | github.com | ✅ Free |
| **Docker Hub** (optional) | Image registry | hub.docker.com | ✅ Free |

---

## Phase 1 — Printify Setup

### Printify Account

| Item | Details |
|------|---------|
| **Printify merchant account** | Sign up at https://printify.com (Free plan works) |
| **Personal Access Token** | Generate at My Profile → Connections. Scopes needed: `shops.read`, `catalog.read`, `products.read`, `products.write`, `orders.read`, `orders.write`, `uploads.read`, `uploads.write`, `webhooks.read`, `webhooks.write` |
| **Shop ID** | Call `GET /v1/shops.json` after creating a shop in Printify dashboard |
| **Printify shop created** | Create at least one shop in Printify dashboard |
| **Webhook secret** | Configure in Printify dashboard settings (for signature verification) |

---

## Phase 2 — Razorpay Setup

| Item | Details |
|------|---------|
| **Razorpay merchant account** | Sign up at https://razorpay.com |
| **API Key ID** | From Razorpay Dashboard → Settings → API Keys |
| **API Key Secret** | From Razorpay Dashboard → Settings → API Keys |
| **Webhook secret** | Configure webhook in Razorpay Dashboard → Settings → Webhooks. Endpoint: `https://yourdomain.com/api/razorpay/webhooks`. Events: `payment.captured`, `payment.failed` |
| **Test mode** | Use test keys while developing; switch to live keys for production |

---

## Phase 3 — Email Setup

Choose one SMTP provider:

| Provider | Free Tier | Setup |
|----------|-----------|-------|
| **Gmail SMTP** | 500 emails/day | Enable App Password in Google Account |
| **SendGrid** | 100 emails/day | Sign up at sendgrid.com, create API key |
| **Mailgun** | 100 emails/day | Sign up at mailgun.com, verify domain |
| **SMTP2GO** | 1000 emails/month | Sign up at smtp2go.com |
| **Self-hosted SMTP** | Unlimited | Requires mail server setup |

You need: SMTP Host, Port, Username, Password, and From Email address.

---

## Phase 4 — File Storage (MinIO)

| Item | Details |
|------|---------|
| **MinIO Access Key** | Generate during Docker setup (set in `.env`) |
| **MinIO Secret Key** | Generate during Docker setup (set in `.env`) |
| **Bucket creation** | Bucket `pod-assets` created automatically on first run |

> MinIO runs self-hosted in your Docker Compose. No external account needed.

---

## Phase 5 — Analytics (PostHog)

PostHog runs self-hosted in Docker. You need to set:

| Item | Details |
|------|---------|
| **POSTHOG_API_KEY** | Generated during PostHog setup UI (first-time setup) |
| **NEXT_PUBLIC_POSTHOG_HOST** | `http://posthog:8000` (internal) or `https://analytics.yourdomain.com` |

> PostHog self-hosted is free and unlimited. No external account needed.

---

## Phase 6 — Monitoring (Sentry / GlitchTip)

| Option | Setup |
|--------|-------|
| **Sentry (self-hosted)** | Run Sentry Docker container (resource-heavy) |
| **Sentry (cloud)** | Free tier: 5k events/month at https://sentry.io |
| **GlitchTip** | Open-source Sentry alternative, Docker deploy |

Needed: DSN URL (`SENTRY_DSN` in env).

---

## Phase 7 — Production VPS Setup Checklist

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 8 GB (4 GB insufficient due to PostHog + services) | 12 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Docker | 24+ | Latest |
| Docker Compose | v2+ | v2+ |

### Software to Install on VPS

```bash
# All of these (deployment script will handle):
- Docker
- Docker Compose
- Nginx (or run via Docker)
- certbot (for Let's Encrypt SSL)
- fail2ban (security)
- ufw (firewall)
```

### DNS Setup

| Record | Type | Value |
|--------|------|-------|
| `podstore.com` | A | Your VPS IP address |
| `www.podstore.com` | CNAME | `podstore.com` |

### Firewall Rules

| Port | Purpose | Source |
|------|---------|--------|
| 22 | SSH | Your IP only |
| 80 | HTTP (redirect to HTTPS) | Any |
| 443 | HTTPS | Any |
| 5432 | PostgreSQL | Docker internal only |
| 6379 | Redis | Docker internal only |

---

## Phase 8 — Ongoing Operations

### Daily / Weekly

| Task | Frequency | Tool |
|------|-----------|------|
| Monitor orders | Daily | Admin dashboard |
| Check dead letter queue | Daily | Admin → Logs |
| Process refunds | As needed | Admin → Orders |
| Review analytics | Weekly | Admin → Analytics |

### Monthly

| Task | Purpose |
|------|---------|
| Review Printify billing | Verify provider costs |
| Rotate API keys | Security best practice |
| Check backup integrity | Restore test to staging |
| Update dependencies | Security patches |

### Incident Response

| Scenario | Action |
|----------|--------|
| Printify API down | Check status.printify.com. Queue orders manually. |
| Razorpay API down | Check status.razorpay.com. Monitor webhook queue. |
| Webhook delivery failing | Check webhook log in admin. Re-register if needed. |
| Server down | VPS provider dashboard → restart. Check backups. |
| Payment failed but order submitted | Manual refund + cancel in admin. |

---

## Environment Variables File (`.env.production`)

Here's every variable you need to provide:

```env
# App
NODE_ENV=production
APP_URL=https://podstore.com
NEXT_PUBLIC_SITE_URL=https://podstore.com

# Database
DATABASE_URL=postgresql://pod:YOUR_DB_PASS@postgres:5432/pod
DB_PASSWORD=YOUR_DB_PASS

# Redis
REDIS_URL=redis://redis:6379

# Auth
AUTH_SECRET=your-random-64-char-secret
AUTH_URL=https://podstore.com

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# Printify
PRINTIFY_API_TOKEN=your_printify_token
PRINTIFY_SHOP_ID=12345
PRINTIFY_WEBHOOK_SECRET=your_webhook_secret

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_smtp_password
SMTP_FROM=store@podstore.com

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_secret
MINIO_PUBLIC_URL=minio.podstore.com

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://analytics.podstore.com
POSTHOG_API_KEY=phx_xxxxxxxx

# Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Logging
LOG_LEVEL=info
```

---

## Skills / Knowledge Required

| Skill | Level | For |
|-------|-------|-----|
| **Command line basics** | Beginner | Running Docker, checking logs |
| **Docker basics** | Beginner | `docker compose up`, `docker compose down` |
| **Git basics** | Beginner | Pulling updates, checking status |
| **Browser dev tools** | Beginner | Debugging frontend issues |
| **Basic troubleshooting** | Beginner | Reading error messages, checking logs |
| **HTML/email design** | Optional | Customizing email templates |
| **Image editing** | Optional | Creating product mockups |

---

## Time Commitment

| Role | Phase | Effort |
|------|-------|--------|
| **Initial setup** | Phase 0-1 | 1-2 hours (one-time) |
| **Account registrations** | Phase 2-3 | 30 min (one-time) |
| **Content creation** | Ongoing | 1-2 hours per new product |
| **Daily operations** | Post-launch | 15-30 min per day |
| **Maintenance** | Monthly | 1-2 hours |

---

## Quick Start: What to Do Right Now

1. [ ] Install Node.js, pnpm, Docker Desktop
2. [ ] Create GitHub repository and clone it
3. [ ] Sign up for Printify account → generate API token
4. [ ] Sign up for Razorpay account → generate API keys
5. [ ] Choose email provider → get SMTP credentials
6. [ ] Buy a domain name
7. [ ] Purchase a VPS (Ubuntu 24.04)
8. [ ] Set DNS records to point to VPS
9. [ ] Share all API keys/tokens with the developer (store in `.env`)
10. [ ] Done — development can begin
