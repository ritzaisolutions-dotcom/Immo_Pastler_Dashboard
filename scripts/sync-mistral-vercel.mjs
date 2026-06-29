/**
 * Pull Mistral API key from n8n credential and set Vercel production env.
 */
import { execSync } from "node:child_process";

const CREDENTIAL_ID = "8vIPKaY9yiEOqikP";

async function n8nCookie() {
  const login = await fetch("https://n8n.ritz-ai.solutions/rest/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrLdapLoginId: "ritzaisolutions@gmail.com",
      password: "DfVfdW6a",
    }),
  });
  if (!login.ok) throw new Error(`n8n login failed: ${login.status}`);
  return (login.headers.getSetCookie?.() || [])
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function main() {
  const cookie = await n8nCookie();
  const res = await fetch(
    `https://n8n.ritz-ai.solutions/rest/credentials/${CREDENTIAL_ID}?includeData=true`,
    { headers: { Cookie: cookie } },
  );
  const data = (await res.json()).data;
  const apiKey = data?.data?.apiKey;
  if (!apiKey || apiKey.length < 20) {
    throw new Error("Mistral API key not found in n8n credential");
  }

  try {
    execSync("vercel env rm MISTRAL_API_KEY production --yes", {
      stdio: "pipe",
    });
  } catch {
    // may not exist
  }

  execSync(`vercel env add MISTRAL_API_KEY production --value "${apiKey}" --yes`, {
    stdio: "inherit",
  });

  console.log(`MISTRAL_API_KEY set on Vercel (length ${apiKey.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
