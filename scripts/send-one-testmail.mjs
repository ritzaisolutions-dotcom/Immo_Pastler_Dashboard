/**
 * Send a single pipeline test email via SMTP (no DB writes).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, PIPELINE_TEST_INBOX } =
  process.env;

if (!PIPELINE_TEST_INBOX || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("SMTP/PIPELINE_TEST_INBOX in .env.local fehlt.");
  process.exit(1);
}

const text = `Guten Tag,

seit heute Morgen lässt sich die Wohnungstür in der Hauptstraße 12 in Koblenz
(3. OG links) nicht mehr abschließen. Das Schloss klemmt und die Tür bleibt
offen stehen — das ist ein Sicherheitsrisiko.

Bitte um schnelle Beauftragung eines Schlüsseldienstes oder Handwerkers.

Mit freundlichen Grüßen
Thomas Weber
Tel. +49 261 123456`;

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT ?? 587),
  secure: Number(SMTP_PORT ?? 587) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

const messageId = `<pastler-test-${crypto.randomUUID()}@demo.local>`;

const info = await transport.sendMail({
  from: `"Thomas Weber" <${SMTP_FROM ?? SMTP_USER}>`,
  replyTo: "thomas.weber@demo-mieter.de",
  to: PIPELINE_TEST_INBOX,
  subject: "[Pastler-Test] Haustürschloss defekt — Sicherheitsrisiko",
  text,
  messageId,
});

console.log(`Gesendet an: ${PIPELINE_TEST_INBOX}`);
console.log(`Betreff: [Pastler-Test] Haustürschloss defekt — Sicherheitsrisiko`);
console.log(`Message-ID: ${messageId}`);
console.log(`SMTP: ${info.response}`);
