/**
 * Demo-Abnahme: HTTP-Routen, Supabase-Daten, Chat-API (ohne Login).
 * Usage: node scripts/verify-demo-ui.mjs [--production]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PRODUCTION = process.argv.includes("--production");
const BASE = PRODUCTION
  ? "https://immo-pastler-dashboard.vercel.app"
  : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function loadEnvFile(filename) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const routes = [
  { path: "/login", expectStatus: 200, label: "Login" },
  { path: "/dashboard", expectRedirect: "/login", label: "Dashboard (auth)" },
  { path: "/emails", expectRedirect: "/login", label: "E-Mails (auth)" },
  { path: "/objekte", expectRedirect: "/login", label: "Objekte (auth)" },
  { path: "/partner", expectRedirect: "/login", label: "Partner (auth)" },
  { path: "/mieter", expectRedirect: "/login", label: "Mieter (auth)" },
  { path: "/chat", expectRedirect: "/login", label: "KI-Chat (auth)" },
  { path: "/todos", expectRedirect: "/login", label: "Todos (auth)" },
  { path: "/vermieter", expectRedirect: "/login", label: "Vermieter (auth)" },
  { path: "/datenschutz", expectRedirect: "/login", label: "Datenschutz (auth)" },
  { path: "/inserate", expectRedirect: "/objekte", label: "Redirect inserate→objekte" },
];

async function checkRoute({ path: routePath, expectStatus, expectRedirect, label }) {
  const res = await fetch(`${BASE}${routePath}`, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  let ok = false;
  let detail = `HTTP ${res.status}`;

  if (expectStatus) {
    ok = res.status === expectStatus;
  } else if (expectRedirect) {
    ok =
      (res.status === 307 || res.status === 308 || res.status === 302) &&
      location.includes(expectRedirect);
    detail = `${res.status} → ${location}`;
  }

  return { label, route: routePath, ok, detail };
}

async function supabaseCount(table, selectCol = "id") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${selectCol}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "count=exact",
    },
  });
  const range = res.headers.get("content-range") ?? "";
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function checkData() {
  const checks = [
    { label: "Objekte (3 Koblenz)", table: "pastler_inserate", min: 3 },
    { label: "Wohneinheiten", table: "pastler_wohneinheiten", min: 6 },
    { label: "Gewerke (dynamisch)", table: "pastler_gewerke", min: 7, selectCol: "key" },
    { label: "Demo-E-Mails", table: "pastler_emails", min: 8 },
    { label: "Todos", table: "pastler_todos", min: 8 },
    { label: "Partner", table: "pastler_partner", min: 5 },
    { label: "Mieter", table: "pastler_mieter", min: 5 },
    { label: "Partner-Entwürfe", table: "pastler_partner_nachrichten", min: 4 },
  ];

  const results = [];
  for (const c of checks) {
    const count = await supabaseCount(c.table, c.selectCol ?? "id");
    const ok = count !== null && count >= c.min;
    results.push({
      label: c.label,
      ok,
      detail: count === null ? "count failed" : `${count} (min ${c.min})`,
    });
  }
  return results;
}

async function checkChatApi() {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "Hallo" }] }),
  });
  const body = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { raw: body.slice(0, 120) };
  }
  const ok = res.status === 401;
  return {
    label: "Chat API ohne Session → 401",
    ok,
    detail: `HTTP ${res.status} ${parsed.error ?? ""}`,
  };
}

function printSection(title, rows) {
  console.log(`\n=== ${title} ===\n`);
  for (const r of rows) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
    console.log(`       ${r.detail ?? r.route ?? ""}`);
  }
}

async function main() {
  console.log(`Base URL: ${BASE}`);
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Supabase env missing");
    process.exit(1);
  }

  const routeResults = [];
  for (const r of routes) {
    routeResults.push(await checkRoute(r));
  }

  const dataResults = await checkData();
  const chatResult = await checkChatApi();

  printSection("HTTP-Routen", routeResults);
  printSection("Supabase Demo-Daten", dataResults);
  printSection("API", [chatResult]);

  const all = [...routeResults, ...dataResults, chatResult];
  const failed = all.filter((r) => !r.ok);
  console.log(`\n${all.length - failed.length}/${all.length} checks passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
