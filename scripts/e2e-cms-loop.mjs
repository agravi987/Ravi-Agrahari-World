/**
 * e2e-cms-loop.mjs — Phase 11 end-to-end test of the CMS → UI loop.
 *
 * With MongoDB running + the site on :3000, this script:
 *   1. Logs into NextAuth (credentials) and keeps the session cookie.
 *   2. Creates a NEW project via the admin API.
 *   3. Verifies the home page shows it (ISR revalidation on mutation).
 *   4. Edits the project → verifies the home page updates.
 *   5. Deletes the project → verifies the home page no longer shows it.
 *
 * Exits non-zero on any failed assertion.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let failures = 0;
const ok = (msg) => console.log("  \u2705 " + msg);
const fail = (msg) => {
  console.error("  \u274c " + msg);
  failures++;
};

/** Minimal cookie jar — tracks Set-Cookie across redirects. */
function makeJar() {
  const cookies = new Map();
  return {
    add(res) {
      const sc = res.headers.getSetCookie?.() ?? [];
      if (sc.length === 0 && res.headers.get("set-cookie")) {
        sc.push(res.headers.get("set-cookie"));
      }
      for (const line of sc) {
        const [pair] = line.split(";");
        const eq = pair.indexOf("=");
        if (eq < 0) continue;
        cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    },
    header() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    has(name) {
      return cookies.has(name);
    },
  };
}

async function req(path, { method = "GET", body, jar, contentType, follow = true } = {}) {
  const headers = {};
  if (jar) headers.cookie = jar.header();
  if (body !== undefined) headers["content-type"] = contentType ?? "application/json";
  const res = await fetch(BASE + path, {
    method,
    headers,
    body,
    redirect: follow ? "follow" : "manual",
  });
  if (jar) jar.add(res);
  return res;
}

async function main() {
  console.log("\nCMS → UI end-to-end (MongoDB + auth + ISR revalidation)");

  // ── 1. Login ───────────────────────────────────────────────────────
  const jar = makeJar();
  const csrfRes = await req("/api/auth/csrf", { jar });
  const csrf = (await csrfRes.json()).csrfToken;
  if (!csrf) return fail("no csrf token");
  ok("got CSRF token + cookies");

  const loginBody = new URLSearchParams({
    csrfToken: csrf,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    callbackUrl: BASE + "/admin",
  }).toString();
  await req("/api/auth/callback/credentials", {
    method: "POST",
    body: loginBody,
    jar,
    contentType: "application/x-www-form-urlencoded",
    follow: false,
  });
  await req("/api/auth/csrf", { jar }); // pick up refreshed csrf cookie

  const sessionRes = await req("/api/auth/session", { jar });
  const session = await sessionRes.json().catch(() => null);
  if (session?.user?.email !== ADMIN_EMAIL) {
    return fail(`login failed — session=${JSON.stringify(session)}`);
  }
  ok(`authenticated as ${session.user.email}`);

  // Unauthenticated admin API must 401 (defense check).
  const anonJar = makeJar();
  const anon = await req("/api/admin/project", { jar: anonJar });
  if (anon.status !== 401) fail(`unauthenticated admin API returned ${anon.status}, expected 401`);
  else ok("unauthenticated admin API blocked (401)");

  // ── 2. Create a project ────────────────────────────────────────────
  const UNIQUE = `E2E Test ${Date.now()}`;
  const payload = {
    title: UNIQUE,
    description: "Created by the end-to-end CMS test — will be deleted.",
    tech: ["Next.js", "Test"],
    featured: false,
    order: 999,
  };
  const createRes = await req("/api/admin/project", {
    method: "POST",
    jar,
    body: JSON.stringify({ data: payload }),
  });
  const created = await createRes.json().catch(() => null);
  if (!createRes.ok || !created?.data?._id) {
    return fail(`create failed (${createRes.status}): ${JSON.stringify(created)}`);
  }
  const projectId = created.data._id;
  ok(`created project "${UNIQUE}" (_id ${projectId})`);

  // ── 3. Home reflects the new project ───────────────────────────────
  await new Promise((r) => setTimeout(r, 500)); // let revalidation settle
  const home1 = await (await fetch(BASE + "/")).text();
  if (home1.includes(UNIQUE)) ok("home page shows the new project after save");
  else fail("home page did NOT show the new project");

  // ── 4. Edit → home updates ─────────────────────────────────────────
  const EDITED = `${UNIQUE} — edited`;
  const editRes = await req(`/api/admin/project/${projectId}`, {
    method: "PUT",
    jar,
    body: JSON.stringify({ data: { title: EDITED } }),
  });
  if (!editRes.ok) return fail(`edit failed (${editRes.status})`);
  await new Promise((r) => setTimeout(r, 500));
  const home2 = await (await fetch(BASE + "/")).text();
  if (home2.includes(EDITED)) ok("home page shows the edited title after save");
  else fail("home page did NOT update after the edit");

  // ── 5. Delete → home no longer shows it ────────────────────────────
  const delRes = await req(`/api/admin/project/${projectId}`, {
    method: "DELETE",
    jar,
  });
  if (!delRes.ok) return fail(`delete failed (${delRes.status})`);
  await new Promise((r) => setTimeout(r, 500));
  const home3 = await (await fetch(BASE + "/")).text();
  if (!home3.includes(EDITED)) ok("home page no longer shows the deleted project");
  else fail("home page still shows the deleted project");

  // ── 6. Admin API session still valid + list intact ─────────────────
  const listRes = await req("/api/admin/project", { jar });
  const list = await listRes.json().catch(() => null);
  if (listRes.ok && Array.isArray(list?.data)) ok(`admin list OK (${list.data.length} projects)`);
  else fail("admin list failed after the mutations");

  console.log(failures === 0 ? "\n\u2705 E2E CMS loop passed." : `\n\u274c ${failures} assertion(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
