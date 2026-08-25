# Orbital — Cloud, DevOps & AI Portfolio

A clean, light-themed portfolio for a fresher exploring Cloud, DevOps and AI — built to show **learning in public**. It ships with its own **MongoDB-backed CMS at `/admin`** (a hiring-proof project in itself), a markdown blog, and a deploy badge. See `plan.md` (build plan) and `docs/ui-ux-design.md` (design system & UI/UX decisions) for the full story.

## Features

- **Admin CMS (`/admin`)** — schema-driven CRUD for all content (site config, skills, learning tracks, projects, experience, certifications, posts) with session-checked API routes and instant site revalidation after every edit.
- **Markdown blog** — `/blog/[slug]` renders CMS-authored markdown (SSG + ISR).
- **Zero-data policy** — no metric ever renders as 0; empty sections auto-hide.
- **Extras** — dark mode (no flash, React 19–safe), Ctrl+K terminal easter egg, mobile nav, custom 404, deploy badge, ISR everywhere.

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · MongoDB + Mongoose · NextAuth.js v5 (Credentials + JWT) · Cloudinary · react-markdown · simple-icons + lucide-react

---

## Getting Started (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/orbital-portfolio.git
cd orbital-portfolio
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

**Required Environment Variables:**

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string (see MongoDB setup below) | ✅ Yes |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | ✅ Yes |
| `AUTH_TRUST_HOST` | Set to `true` for local dev | ✅ Yes |
| `AUTH_URL` | Your local dev URL (e.g., `http://localhost:3000`) | ✅ Yes |
| `ADMIN_EMAIL` | Admin login email (created by seed script) | ✅ Yes |
| `ADMIN_PASSWORD` | Admin login password (created by seed script) | ✅ Yes |
| `NEXT_PUBLIC_GITHUB_USERNAME` | Your GitHub username for stats/strip | ✅ Yes |
| `NEXT_PUBLIC_SITE_URL` | Base URL for SEO/sitemap (local: `http://localhost:3000`) | ✅ Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional, for image uploads) | ❌ No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ❌ No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ❌ No |

---

### 4. Choose Your MongoDB Setup (3 Options)

#### Option A: MongoDB Atlas (Cloud — Recommended for Production Parity)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **M0 Free Tier** cluster (AWS/GCP/Azure)
3. **Database Access** → Add Database User → Username/Password (save these!)
4. **Network Access** → Add IP Address → `0.0.0.0/0` (Allow from anywhere for dev)
5. **Clusters** → Connect → **Drivers** → Copy the connection string
6. Replace `<password>` with your database user password and `<dbname>` with `portfolio`
7. Add to `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
   ```

#### Option B: MongoDB in Docker (Recommended for Local Dev)

```bash
# Start MongoDB container with persistent volume
docker run -d \
  --name mongo-dev \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  mongo:7
```
 
Add to `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
```

**Useful Docker Commands:**
```bash
docker stop mongo-dev      # Stop container
docker start mongo-dev     # Start container
docker logs mongo-dev      # View logs
docker rm -v mongo-dev     # Remove container + volume (fresh start)
```

#### Option C: Install MongoDB Locally

**Windows:**
1. Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run installer → Choose "Complete" → Install as Service
3. MongoDB runs on `mongodb://127.0.0.1:27017` by default

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Follow official docs for your distro
# https://www.mongodb.com/docs/manual/administration/install-community/
```

Add to `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
```

---

### 5. Seed the Database

With `MONGODB_URI` configured, seed the database (idempotent — safe to run multiple times):

```bash
npm run seed
```

This creates:
- All collections with sample content
- Admin user (using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`)

> **Note:** The app **falls back to bundled seed data automatically when `MONGODB_URI` is absent**. This means fresh clones can build and run without a database for UI development.

---

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Access the Admin CMS

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Sign in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. Edit content — changes appear on the live site immediately (via `revalidatePath`)

---

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (writes deploy badge, runs typecheck) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint (types + next rules) |
| `npm run typecheck` | TypeScript type checking only |
| `npm run seed` | Seed MongoDB + create admin user (idempotent) |
| `npm run test` | Run Vitest unit tests |

---

## Project Structure

```
src/
├── app/                    # Routes: home, /blog/[slug], /admin, /api/*
│   ├── admin/             # CMS pages (login, dashboard, collections)
│   ├── api/               # API routes (admin CRUD, upload, galaxy, contact)
│   ├── blog/              # Blog pages (list, tag, [slug])
│   ├── detailed-galaxy/   # Full Learning Galaxy explorer
│   ├── globals.css        # Design tokens (Tailwind v4)
│   └── layout.tsx         # Root layout + providers
├── components/
│   ├── sections/          # 8 home page sections (Hero, Skills, Galaxy, Projects, Experience, Certifications, Blog, Contact)
│   ├── admin/             # CollectionForm (schema-driven CRUD UI)
│   ├── blog/              # Blog-specific components
│   ├── galaxy/            # Learning Galaxy (2D/3D, planets, moons)
│   └── ui/                # Reusable UI primitives (Button, Card, Badge, etc.)
├── lib/                   # Core utilities
│   ├── auth.ts            # NextAuth config
│   ├── content.ts         # THE content boundary (seed ↔ MongoDB)
│   ├── db.ts              # Cached MongoDB connection
│   ├── github.ts          # Build-time GitHub stats
│   └── cloudinary.ts      # Cloudinary upload helpers
├── models/                # Mongoose schemas (mirror types/index.ts)
└── types/                 # Shared content types (single source of truth)
```

---

## Key Concepts

### Content Boundary (`lib/content.ts`)

This is the **only** place where the app reads content. It:
- Returns seed data when `MONGODB_URI` is not set (no DB required for builds)
- Switches to Mongoose queries when `MONGODB_URI` is present
- Exports identical TypeScript types either way

### Zero-Data Policy (Plan §5)

- No metric renders as `0` — empty values are hidden
- Empty collections auto-hide their sections on the homepage
- Admin toggles in `siteConfig.sectionsEnabled` control visibility

### Learning Galaxy (`components/galaxy/`)

- **Planets** = learning topics (from `learningTrack` collection)
- **Moons** = GitHub repos (notes/hands-on/projects)
- 2D (Canvas) + 3D (Three.js) views with reduced-motion fallback (accessible table)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `MongooseServerSelectionError: connect ECONNREFUSED` | MongoDB not running. Start Docker container or local service. |
| `AUTH_SECRET` error | Generate new secret: `openssl rand -base64 32` |
| Admin login fails | Re-run `npm run seed` to recreate admin user |
| Build fails on Vercel | Ensure all env vars are set in Vercel dashboard (including `NEXT_PUBLIC_*` ones) |
| Images not uploading | Add Cloudinary credentials to `.env.local` and Vercel |

---

## Dev Tooling (Gitignored)

- **AI Skills** (design intelligence) — reinstall: `npx skills add nextlevelbuilder/ui-ux-pro-max-skill --all`
- **21st MCP** (VS Code) — configured in `.vscode/mcp.json` (API key from https://21st.dev/mcp)

---

## License

MIT — feel free to fork and customize for your own portfolio.