# Deploy Guide — TOEIC Brain

## Architecture
- **Frontend** → Vercel (free)
- **Backend**  → Railway (free tier)
- **Database** → PostgreSQL on Railway (free tier)

---

## 1. Backend → Railway

### Setup
1. ไปที่ [railway.app](https://railway.app) → Sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. เลือก repo → เลือก folder `backend` (ถ้า monorepo ให้ set Root Directory = `backend`)
4. Railway จะ detect `Procfile` และรัน uvicorn อัตโนมัติ

### เพิ่ม PostgreSQL
1. ใน Project → **Add Service** → **Database** → **PostgreSQL**
2. Railway จะ inject `DATABASE_URL` ให้ backend โดยอัตโนมัติ

### Environment Variables ใน Railway
```
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### ได้ URL แบบนี้
```
https://your-app.up.railway.app
```

---

## 2. Frontend → Vercel

### Setup
1. ไปที่ [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New Project** → import repo → เลือก folder `frontend`
3. Framework preset: **Next.js** (auto-detect)

### Environment Variables ใน Vercel
```
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```
(ใส่ URL จาก Railway ด้านบน)

4. **Deploy** → ได้ URL: `https://your-app.vercel.app`

---

## 3. อัปเดต CORS ใน Railway

กลับไปที่ Railway → แก้ `CORS_ORIGIN` ให้ตรงกับ Vercel URL:
```
CORS_ORIGIN=https://your-app.vercel.app
```

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend  
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend:  http://localhost:8000
