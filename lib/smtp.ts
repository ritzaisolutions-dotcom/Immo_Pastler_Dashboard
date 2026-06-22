import nodemailer from "nodemailer";

export function createSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendPartnerEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const transport = createSmtpTransport();
  if (!transport) {
    return { ok: false, error: "SMTP nicht konfiguriert" };
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Senden fehlgeschlagen";
    return { ok: false, error: message };
  }
}
