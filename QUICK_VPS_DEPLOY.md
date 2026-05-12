# ⚡ Quick VPS Deploy - Super Simple

## 📋 आपको ये चाहिए:
- ✅ VPS IP (जैसे: 123.45.67.89)
- ✅ VPS Password
- ✅ आपका Project folder

---

## 📤 STEP 1: Project Upload (WinSCP से)

1. **WinSCP Download:** https://winscp.net/
2. **Connect करें:**
   - Host: आपका VPS IP
   - User: root
   - Password: आपका VPS password
3. **Upload करें:**
   - Left side से project folder select करें
   - Right side में `/root` में जाएं
   - Drag & drop करें

---

## 🔌 STEP 2: VPS Connect (PuTTY से)

1. **PuTTY Download:** https://www.putty.org/
2. **Connect करें:**
   - Host Name: आपका VPS IP
   - Port: 22
   - Open दबाएं
3. **Login:**
   - Login as: root
   - Password: आपका VPS password

---

## 🚀 STEP 3: Deploy Script Run करें

ये commands एक-एक करके run करें:

```bash
# Script को executable बनाएं
chmod +x /root/my\ project/scripts/deploy-simple.sh

# Script run करें
cd /root
./my\ project/scripts/deploy-simple.sh
```

**Wait करें - ये 5-10 minutes ले सकता है!**

---

## ⚙️ STEP 4: .env File Edit करें

```bash
cd /root/saas-app
nano .env
```

**इन values को update करें:**

```env
NODE_ENV=production
PORT=4000
BASE_URL=http://YOUR_VPS_IP

DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@postgres:5432/whatsapp_saas?schema=public

JWT_SECRET=generate_की_huyi_value
JWT_REFRESH_SECRET=generate_की_huyi_value
ENCRYPTION_KEY=generate_की_huyi_value

REDIS_PASSWORD=generate_की_huyi_value
N8N_PASSWORD=generate_की_huyi_value

OPENROUTER_API_KEY=अपनी_key
META_APP_ID=अपनी_app_id
META_APP_SECRET=अपनी_app_secret
```

**Save:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 🔄 STEP 5: Restart करें

```bash
docker compose -f docker-compose.prod.yml restart
```

---

## 👤 STEP 6: Admin बनाएं

```bash
curl -X POST http://localhost:4000/api/auth/create-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "Admin@Secure123!",
    "name": "Super Admin"
  }'
```

**इन details को save कर लें!**

---

## ✅ STEP 7: Check करें

```bash
# Containers check करें
docker ps

# Health check करें
curl http://localhost:4000/health
```

---

## 🌐 STEP 8: Browser में Open करें

```
http://YOUR_VPS_IP:5173     → आपका App
http://YOUR_VPS_IP:4000     → Backend
http://YOUR_VPS_IP:5678     → n8n
```

**Login:**
- Email: `admin@yourdomain.com`
- Password: `Admin@Secure123!`

---

## 🔧 अगर Problem आए?

### Restart Everything:
```bash
cd /root/saas-app
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Logs देखें:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🎯 Done!

आपका project VPS पर deploy हो गया! 🎉

---

**अगर कोई problem है तो बताएं!**
