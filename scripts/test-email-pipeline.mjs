/**
 * E2E-Test der E-Mail-Automation (IMAP → n8n → Supabase).
 *
 * Senden (optional): SMTP_* in .env setzen, dann:
 *   node scripts/test-email-pipeline.mjs --send
 *
 * Nur Auswertung:
 *   node scripts/test-email-pipeline.mjs
 *
 * Empfänger-Inbox (n8n IMAP): PIPELINE_TEST_INBOX in .env.local setzen
 */

import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const ROOT = path.resolve(import.meta.dirname, "..");

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
const INBOX = process.env.PIPELINE_TEST_INBOX;
const shouldSend = process.argv.includes("--send");

const TEST_EMAILS = [
  {
    fromName: "Thomas Weber",
    from: "thomas.weber@demo-mieter.de",
    subject: `[Pastler-Test] Defekte Beleuchtung Treppenhaus — ${new Date().toISOString()}`,
    text: `Guten Tag,\n\nseit zwei Tagen ist die Beleuchtung im Treppenhaus der Hauptstraße 12 in Koblenz ausgefallen.\nBitte um schnelle Behebung.\n\nThomas Weber\n3. OG links`,
    expect: { quelle: "absender_mieter", gewerk: "elektriker", partner: true },
  },
  {
    fromName: "Unbekannt",
    from: `cursor-test-${Date.now()}@unbekannt.demo`,
    subject: `[Pastler-Test] Heizung Rheinweg 45 — ${new Date().toISOString()}`,
    text: `Sehr geehrte Hausverwaltung,\n\nim Objekt Rheinweg 45 in Koblenz (EG) ist die Heizung ausgefallen.\n\nMfG`,
    expect: { quelle: "inhalt_objekt", gewerk: "hausmeister", partner: true },
  },
];

async function supabaseFetch(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rpcResolve(vonEmail, betreff, inhalt) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pastler_resolve_zuordnung`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_von_email: vonEmail,
      p_betreff: betreff,
      p_inhalt: inhalt,
    }),
  });
  if (!res.ok) throw new Error(`RPC: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sendTestEmails() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!INBOX) {
    console.error("PIPELINE_TEST_INBOX in .env.local setzen (n8n IMAP-Postfach).");
    process.exit(1);
  }
  if (!host || !user || !pass) {
    console.error(
      "SMTP nicht konfiguriert. Setze SMTP_HOST, SMTP_USER, SMTP_PASS in .env und starte mit --send.",
    );
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  });

  for (const mail of TEST_EMAILS) {
    await transport.sendMail({
      from: `"${mail.fromName}" <${user}>`,
      replyTo: mail.from,
      to: INBOX,
      subject: mail.subject,
      text: mail.text,
    });
    console.log(`Gesendet: ${mail.subject}`);
  }
  console.log(`\nWarte auf n8n IMAP-Poll (bis 6 Min.)…`);
}

async function waitForNewEmails(sinceIso, timeoutMs = 360_000) {
  const start = Date.now();
  const subjects = TEST_EMAILS.map((m) => m.subject);
  while (Date.now() - start < timeoutMs) {
    const rows = await supabaseFetch(
      "pastler_emails",
      `select=id,betreff,von_email,verarbeitet,zuordnung_quelle,zuordnung_konfidenz,mieter_id,inserat_id,empfangen_at&betreff=like.[Pastler-Test]*&order=empfangen_at.desc`,
    );
    const recent = rows.filter((r) => r.empfangen_at >= sinceIso);
    if (recent.length >= TEST_EMAILS.length) return recent;
    await new Promise((r) => setTimeout(r, 30_000));
    process.stdout.write(".");
  }
  return supabaseFetch(
    "pastler_emails",
    `select=id,betreff,von_email,verarbeitet,zuordnung_quelle,empfangen_at&betreff=like.[Pastler-Test]*&order=empfangen_at.desc&limit=10`,
  );
}

async function auditExisting() {
  console.log("=== Bestands-Audit (pastler_emails → todos → partner) ===\n");

  const emails = await supabaseFetch(
    "pastler_emails",
    "select=id,betreff,von_email,verarbeitet,zuordnung_quelle,zuordnung_konfidenz&order=empfangen_at.desc",
  );

  for (const e of emails) {
    const todos = await supabaseFetch(
      "pastler_todos",
      `select=id,titel,kategorie,prioritaet,gewerk,use_case,partner_id&email_id=eq.${e.id}`,
    );
    const todo = todos[0];
    let partnerDraft = null;
    if (todo) {
      const drafts = await supabaseFetch(
        "pastler_partner_nachrichten",
        `select=id,status,betreff&todo_id=eq.${todo.id}&limit=1`,
      );
      partnerDraft = drafts[0] ?? null;
    }

    const issues = [];
    if (e.verarbeitet && !todo) issues.push("verarbeitet ohne Todo");
    if (!e.verarbeitet && todo) issues.push("Todo existiert, E-Mail nicht verarbeitet");
    if (todo?.gewerk && !partnerDraft && todo.kategorie === "extern") {
      issues.push("extern ohne Partner-Entwurf");
    }

    console.log(`• ${e.betreff}`);
    console.log(
      `  Von: ${e.von_email} | Zuordnung: ${e.zuordnung_quelle} (${e.zuordnung_konfidenz}) | verarbeitet: ${e.verarbeitet}`,
    );
    if (todo) {
      console.log(
        `  Todo: ${todo.titel} [${todo.kategorie}/${todo.prioritaet}] gewerk=${todo.gewerk ?? "—"} use_case=${todo.use_case ?? "—"}`,
      );
      console.log(
        `  Partner-Entwurf: ${partnerDraft ? `${partnerDraft.status} — ${partnerDraft.betreff}` : "—"}`,
      );
    } else {
      console.log("  Todo: —");
    }
    if (issues.length) console.log(`  ⚠ ${issues.join("; ")}`);
    console.log();
  }
}

async function testRpcLayer() {
  console.log("=== RPC-Test (pastler_resolve_zuordnung) ===\n");
  for (const mail of TEST_EMAILS) {
    const z = await rpcResolve(mail.from, mail.subject, mail.text);
    const ok =
      z.quelle === mail.expect.quelle ||
      (mail.expect.quelle === "inhalt_objekt" &&
        ["inhalt_objekt", "inhalt_einheit"].includes(z.quelle));
    console.log(
      `${ok ? "✓" : "✗"} ${mail.fromName}: quelle=${z.quelle} (${z.konfidenz}), mieter=${z.mieter_id ? "ja" : "nein"}, inserat=${z.inserat_id ? "ja" : "nein"}`,
    );
  }
  console.log();
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY erforderlich.");
    process.exit(1);
  }

  await testRpcLayer();
  await auditExisting();

  if (shouldSend) {
    const since = new Date().toISOString();
    await sendTestEmails();
    const found = await waitForNewEmails(since);
    console.log(`\n=== Neue Test-E-Mails in Supabase: ${found.length} ===\n`);
    for (const e of found) {
      console.log(`• ${e.betreff} | verarbeitet=${e.verarbeitet} | ${e.zuordnung_quelle ?? "—"}`);
    }
  } else {
    console.log(
      "Hinweis: Live-Send-Test mit --send (SMTP_* in .env). Inbox: " + INBOX,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
