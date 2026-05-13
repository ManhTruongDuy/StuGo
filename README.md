# StuGo — Student Services Platform

Monorepo containing the backend API and frontend web app for StuGo.

## Structure

```
StuGo/
├── stugo-be/          # Node.js + Express + MongoDB API
├── stugo-fe/          # React + TypeScript + Vite frontend
├── docker-compose.prod.yml   # Production deployment
└── .github/workflows/ci.yml  # CI/CD pipeline
```

## Quick Start

Install dependencies for both projects:
```bash
npm run install:all
```

Run backend in dev mode:
```bash
npm run dev:be
```

Run frontend in dev mode:
```bash
npm run dev:fe
```

Build frontend for production:
```bash
npm run build:fe
```

## Environment Setup

Copy the example env file and fill in your values:
```bash
cp stugo-be/.env.example stugo-be/.env
```

## Docker (Production)

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Backend

- **Port:** 3000
- **Stack:** Node.js 18+, Express, MongoDB (Mongoose), JWT, Google OAuth, PayOS
- See `stugo-be/README.md` for full API docs

## Frontend

- **Port:** 5173 (dev), 80 (production via nginx)
- **Stack:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router
