# 🎮 PlayHost - Minecraft Hosting Platform

פלטפורמת אחסון Minecraft חינמית מקצועית עם ממשק מודרני וכל הכלים הדרושים.

## ✨ תכונות עיקריות

✅ הפעלת שרתים בחינם בלחיצה אחת
✅ תמיכה ב-Paper, Spigot, Vanilla
✅ ממשק ניהול מקצועי
✅ קונסול חי של השרת
✅ מערכת Queue אוטומטית
✅ גיבויים אוטומטיים
✅ Subdomain מותאם אישי
✅ הגנת DDoS בסיסית
✅ מערכת תרומות Premium
✅ Dark Mode מלא
✅ תמיכה בנייד

## 🏗️ Stack טכנולוגי

- **Frontend**: Next.js 14 + React 18 + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Containerization**: Docker + Docker Compose
- **Real-time**: WebSocket (Socket.io)
- **Authentication**: JWT + NextAuth.js

## 📋 דרישות מערכת

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- 32-64GB RAM
- 2000-5000 MHz CPU

## 🚀 התחלת העבודה

```bash
# Clone repository
git clone https://github.com/Netanel201/minecraft-hosting.git
cd minecraft-hosting

# Setup
docker-compose up -d
npm install
npm run setup
npm run dev
```

## 📂 מבנה הפרויקט

```
.
├── apps/
│   ├── web/           # Next.js Frontend
│   ├── api/           # Express Backend
│   └── docker/        # Docker configurations
├── packages/
│   ├── db/            # Prisma + Database
│   ├── auth/          # JWT + NextAuth
│   └── utils/         # Shared utilities
└── docker-compose.yml
```

## 📝 ליסנס

MIT License