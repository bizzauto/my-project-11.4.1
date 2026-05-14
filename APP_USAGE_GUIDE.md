# BizzAuto CRM - Usage Guide (Owner)

## 📱 How to Use the App

### 1. First Time Setup
```bash
# Visit website
https://bizzautoai.com

# Click "Sign up" → Fill form → Create Account
# Automatically lands on Dashboard
```

### 2. Dashboard Overview
- **Stats Cards**: Today's leads, messages, posts, rating
- **Chart**: 7-day activity graph
- **Recent Leads**: Latest contacts

### 3. Features (Working)

| Page | Path | What You Can Do |
|------|------|-----------------|
| Dashboard | `/dashboard` | View stats, charts, recent activity |
| CRM | `/crm` | Manage contacts, deals, invoices, appointments |
| WhatsApp | `/whatsapp` | Connect WhatsApp, send messages (needs Evolution API setup) |
| Leads | `/leads` | View & manage incoming leads |
| E-Commerce | `/ecommerce` | Products, orders, coupons |
| Documents | `/documents` | Upload & manage documents |
| Social | `/social` | Schedule social media posts |
| Reviews | `/reviews` | Manage customer reviews |
| Email Marketing | `/email-marketing` | Campaigns, templates, drips |
| Automation | `/automation` | Auto-reply rules, workflows |
| Settings | `/settings` | Business info, branding, 2FA |
| Profile | `/profile` | Personal info, password |
| Team | `/team` | Invite team members |
| Billing | `/billing` | Subscription & invoices |
| API Keys | `/api-keys` | Generate API keys for integrations |

### 4. Managing Data (Production)

#### View Database
```bash
# On VPS
docker exec -it supabase-db-bfcenobbtiky1hcm4bd2zdfw psql -U postgres -d postgres
```

#### Backup Database
```bash
# Full backup
docker exec -t supabase-db-bfcenobbtiky1hcm4bd2zdfw pg_dump -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker exec -i supabase-db-bfcenobbtiky1hcm4bd2zdfw psql -U postgres -d postgres
```

#### Prisma Studio (Web GUI for DB)
```bash
# On local machine (requires DATABASE_URL in .env)
npx prisma studio
```

### 5. Managing Users
- Go to `/team` page
- Add/remove team members
- Change roles (OWNER, ADMIN, MEMBER, VIEWER)

### 6. Production Deployments
```bash
# SSH into VPS
ssh root@87.76.169.6

# Check container status
docker ps | grep n821x

# View logs
docker logs $(docker ps -q -f name=n821x) --tail 50

# Restart app
docker restart $(docker ps -q -f name=n821x)
```

---

## 🗑️ Services You Can DELETE in Coolify

### SAFE TO DELETE (Not used by the app)
These Supabase services are **NOT needed** because our app only uses Supabase PostgreSQL database:

| Service | Why Delete |
|---------|-----------|
| **Supabase Studio** (`supabase-studio-*`) | Web UI for Supabase - NOT needed |
| **Supabase Kong** (`supabase-kong-*`) | API gateway for Supabase - NOT used |
| **Supabase Auth** (`supabase-auth-*` / `supabase-gotrue-*`) | We use custom JWT auth |
| **Supabase Storage** (`supabase-storage-*`) | NOT used by our app |
| **Supabase Realtime** (`supabase-realtime-*`) | NOT used by our app |
| **Supabase Vector** (`supabase-vector-*`) | NOT used by our app |
| **Supabase Analytics** (`supabase-logflare-*`) | NOT used by our app |
| **Supabase Edge Functions** (`supabase-edge-functions-*`) | NOT used |
| **Supabase Meta** (`supabase-meta-*`) | NOT used |
| **Supabase Supavisor** (`supabase-supavisor-*`) | Connection pooler - NOT needed for single app |
| **imgproxy** (`imgproxy-*`) | Image proxy - NOT used |
| **Supabase MinIO** (`supabase-minio-*`) | Storage backend - NOT used |

### DO NOT DELETE
| Service | Why Keep |
|---------|----------|
| **Supabase DB** (`supabase-db-*`) | ⚡ THIS IS YOUR DATABASE! |
| **PostgreSQL** (`zby7dsx9s8cdbx17e3xu3c0z`) | ⚡ THIS IS YOUR DATABASE! |

### How to Delete Services
In Coolify → Select the service → **Danger Zone** → **Delete**

After deleting, check in Coolify that only these remain:
```
coolify          # Main Coolify app
coolify-proxy    # Traefik reverse proxy
coolify-db       # Coolify's own database
coolify-redis    # Coolify's Redis
coolify-realtime # Coolify's websocket
supabase-db      # YOUR DATABASE (KEEP THIS!)
n821x...         # Your app container
```

---

## ⚠️ IMPORTANT: Don't Delete Supabase DB

The Supabase database (`zby7dsx9s8cdbx17e3xu3c0z` or `supabase-db-*`) contains ALL your app data:
- User accounts
- Business data
- Contacts, messages
- Products, orders
- Everything!

**NEVER delete the database container or the `DATABASE_URL` env var!**

---

## 🔄 Quick Recovery Commands

```bash
# If app crashes
docker restart $(docker ps -q -f name=n821x)
docker restart coolify-proxy

# If DB connection lost
docker restart $(docker ps -q -f name=supabase-db)

# View all running services
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View app logs
docker logs $(docker ps -q -f name=n821x) --tail 100

# Rebuild from GitHub (in Coolify UI)
# Click Deploy → Force Rebuild
```
