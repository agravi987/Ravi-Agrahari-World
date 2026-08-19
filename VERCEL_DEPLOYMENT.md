# Vercel Deployment Guide

Complete guide to deploy the Orbital Portfolio to Vercel with MongoDB, NextAuth, and Cloudinary.

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] MongoDB database ready (Atlas recommended for production)
- [ ] Cloudinary account (optional, for image uploads in admin)
- [ ] All environment variables prepared

---

## Step 1: Prepare Your MongoDB (Production)

### Use MongoDB Atlas (Recommended)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign in
2. Create a new **M0 Free Tier** cluster (or use existing)
3. **Database Access** → Add Database User:
   - Username: `portfolio-admin` (or your choice)
   - Password: **Generate a secure password** (save it!)
   - Database User Privileges: `Read and write to any database`
4. **Network Access** → Add IP Address:
   - Click "Allow Access from Anywhere" (`0.0.0.0/0`)
   - This allows Vercel's dynamic IPs to connect
5. **Clusters** → Connect → **Drivers** → Node.js
6. Copy the connection string:
   ```
   mongodb+srv://portfolio-admin:<password>@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual password

---

## Step 2: Generate Required Secrets

### NextAuth Secret
```bash
openssl rand -base64 32
```
Save this — you'll need it for `AUTH_SECRET`.

### Admin Credentials
Choose secure values for:
- `ADMIN_EMAIL` — e.g., `admin@yourdomain.com`
- `ADMIN_PASSWORD` — strong password (min 12 chars)

---

## Step 3: Push to GitHub

```bash
# If not already initialized
git init
git add -A
git commit -m "Initial commit: Orbital Portfolio"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/orbital-portfolio.git
git branch -M main
git push -u origin main
```

---

## Step 4: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → Select your `orbital-portfolio` repo
3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)
4. **Don't click Deploy yet!** Click **Environment Variables** first.

---

## Step 5: Configure Environment Variables in Vercel

In the Vercel project settings → **Environment Variables**, add each variable:

### Required (All Environments: Production, Preview, Development)

| Name | Value | Notes |
|------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
| `AUTH_SECRET` | `your-generated-secret` | From `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` | Required for Vercel preview deployments |
| `AUTH_URL` | `https://your-project.vercel.app` | **Update after first deploy!** |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Must match seed script |
| `ADMIN_PASSWORD` | `your-secure-password` | Must match seed script |
| `NEXT_PUBLIC_GITHUB_USERNAME` | `your-github-username` | Public — safe to expose |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` | **Update after first deploy!** |

### Optional (Cloudinary — for Admin Image Uploads)

| Name | Value |
|------|-------|
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | `your-api-key` |
| `CLOUDINARY_API_SECRET` | `your-api-secret` |

> **Important:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. All others are server-only.

---

## Step 6: First Deployment

1. Click **Deploy** in Vercel
2. Wait for build to complete (2-3 minutes)
3. **Copy your deployment URL** (e.g., `https://orbital-portfolio-xyz.vercel.app`)

---

## Step 7: Update Environment Variables with Live URL

After first successful deploy:

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Update these two variables with your actual Vercel URL:
   - `AUTH_URL` = `https://your-actual-vercel-url.vercel.app`
   - `NEXT_PUBLIC_SITE_URL` = `https://your-actual-vercel-url.vercel.app`
3. **Redeploy:** Go to **Deployments** → Click the three dots on latest → **Redeploy**

---

## Step 8: Seed Production Database

Once deployed and env vars are set:

### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull env vars locally (creates .env.local)
vercel env pull .env.local

# Run seed against production DB
npm run seed
```

### Option B: Run Seed Locally with Production URI
```bash
# Temporarily use production MONGODB_URI in local .env.local
# Then run:
npm run seed

# Revert to local MONGODB_URI after
```

### Option C: Vercel Serverless Function (One-time)
Create a temporary API route to trigger seed, then remove it.

---

## Step 9: Verify Deployment

### Check These URLs

| URL | Expected Result |
|-----|-----------------|
| `https://your-app.vercel.app` | Homepage loads with all 8 sections |
| `https://your-app.vercel.app/admin/login` | Login page appears |
| `https://your-app.vercel.app/blog` | Blog index with seed posts |
| `https://your-app.vercel.app/detailed-galaxy` | Learning Galaxy explorer |
| `https://your-app.vercel.app/api/health` | `{"status":"ok"}` JSON |
| `https://your-app.vercel.app/sitemap.xml` | Valid XML sitemap |
| `https://your-app.vercel.app/robots.txt` | Valid robots.txt |

### Test Admin CMS

1. Go to `/admin/login`
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. Edit any content (e.g., change a skill level in **Skills**)
4. Return to homepage — change should appear instantly (ISR revalidation)

### Verify Deploy Badge

Scroll to footer — should show:
- **Commit hash** (short SHA)
- **Deploy timestamp** (ISO format)

---

## Step 10: Custom Domain (Optional)

1. Vercel Dashboard → Project → **Settings → Domains**
2. Add your domain (e.g., `portfolio.yourname.com`)
3. Configure DNS as instructed (CNAME for `www`, A record for apex)
4. Update `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your custom domain
5. Redeploy

---

## Environment Variable Checklist for Vercel

```
✅ MONGODB_URI
✅ AUTH_SECRET
✅ AUTH_TRUST_HOST=true
✅ AUTH_URL=https://your-app.vercel.app
✅ ADMIN_EMAIL
✅ ADMIN_PASSWORD
✅ NEXT_PUBLIC_GITHUB_USERNAME
✅ NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
⚪ CLOUDINARY_CLOUD_NAME
⚪ CLOUDINARY_API_KEY
⚪ CLOUDINARY_API_SECRET
```

---

## CI/CD Pipeline

The repo includes `.github/workflows/deploy-meta.yml` which runs on every push to `main`:

```yaml
# Runs automatically on push to main
- npm run lint
- npm run typecheck
- npm run build
```

Vercel auto-deploys on successful merge to `main`.

---

## Troubleshooting

### Build Fails on Vercel

| Error | Fix |
|-------|-----|
| `MongooseServerSelectionError` | Check `MONGODB_URI` in Vercel env vars; ensure Atlas allows `0.0.0.0/0` |
| `AUTH_SECRET` missing | Add `AUTH_SECRET` to Vercel env vars |
| `Module not found` | Check import paths; ensure all files are committed to git |
| TypeScript errors | Run `npm run typecheck` locally first |

### Admin Login Doesn't Work

1. Verify `ADMIN_EMAIL` / `ADMIN_PASSWORD` match exactly in Vercel env vars
2. Run `npm run seed` against production DB
3. Check Vercel Function Logs for NextAuth errors

### Images Don't Upload in Admin

- Add all three `CLOUDINARY_*` variables to Vercel
- Redeploy

### Deploy Badge Shows "(no commit — local dev)"

- This is normal for local builds
- On Vercel, it reads `VERCEL_GIT_COMMIT_SHA` automatically
- Verify in footer after Vercel deployment

### ISR Not Revalidating

- Ensure you're using `revalidatePath` in admin mutations (already implemented)
- Check Vercel Function Logs for `revalidatePath` calls

---

## Monitoring & Logs

- **Vercel Dashboard → Functions** — View serverless function logs
- **Vercel Dashboard → Analytics** — Enable for Core Web Vitals
- **MongoDB Atlas → Metrics** — Monitor database performance
- **Cloudinary Dashboard** — Track image uploads/transformations

---

## Rollback

If a deploy breaks:
1. Vercel Dashboard → **Deployments**
2. Click three dots on previous working deployment
3. **Promote to Production**

---

## Security Notes

- `AUTH_SECRET` must be **32+ chars**, randomly generated
- `ADMIN_PASSWORD` should be **strong** (12+ chars, mixed case, numbers, symbols)
- Never commit `.env.local` or `.env.production` to git
- Atlas: Restrict Network Access to Vercel IP ranges if possible (see Vercel docs for current IPs)
- Rotate secrets periodically

---

## Support Resources

- [Vercel Next.js Docs](https://nextjs.org/docs/app/building-your-application/deploying/vercel)
- [NextAuth v5 Docs](https://authjs.dev/getting-started/installation)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Cloudinary Docs](https://cloudinary.com/documentation)

---

## Quick Reference: One-Line Commands

```bash
# Local dev with Docker MongoDB
docker run -d --name mongo-dev -p 27017:27017 -v mongo-data:/data/db mongo:7 && npm run dev

# Generate all secrets at once
echo "AUTH_SECRET=$(openssl rand -base64 32)" && echo "ADMIN_PASSWORD=$(openssl rand -base64 16)"

# Full local reset
docker rm -v mongo-dev && docker run -d --name mongo-dev -p 27017:27017 -v mongo-data:/data/db mongo:7 && npm run seed && npm run dev

# Vercel deploy from CLI
vercel --prod
```