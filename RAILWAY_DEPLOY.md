# ReportHub — Railway Deployment Guide

## Services to create in Railway

1. **PostgreSQL** (Railway plugin)
2. **Backend** — root dir: `apps/backend`, using `nixpacks.toml`
3. **Frontend** — root dir: `apps/frontend`

## Backend Environment Variables

```
DATABASE_URL=<from Railway PostgreSQL plugin>
JWT_SECRET=<generate a long random string>
JWT_EXPIRES_IN=7d
PORT=3001
UPLOAD_DIR=/data/uploads
FRONTEND_URL=<your frontend Railway URL>
NODE_ENV=production
```

## Frontend Environment Variables

```
NEXT_PUBLIC_API_URL=<your backend Railway URL>
```

## Post-deploy steps

1. Run the seed: `pnpm --filter @reporthub/backend db:seed`
2. Default admin login: `admin@geohan.com` / `Admin@123!`

## Railway Volume (for file uploads)

Attach a Railway Volume to the backend service and mount it at `/data/uploads`.
Set `UPLOAD_DIR=/data/uploads` in the backend environment.
