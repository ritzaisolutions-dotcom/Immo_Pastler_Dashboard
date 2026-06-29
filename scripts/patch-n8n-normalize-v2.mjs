/**
 * Fix Normalize Message ID code + Duplicate Check reference.
 * Uses hash-based fallback IDs safe for PostgREST eq filters.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORKFLOW_ID = "UGzC7bewBV5FoKbq";
const NORMALIZE_NODE_NAME = "Normalize Message ID";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NORMALIZE_CODE = fs.readFileSync(
  path.join(__dirname, "../n8n/code/normalize-message-id.js"),
  "utf8",
);

async function n8nCookie() {
  const login = await fetch("https://n8n.ritz-ai.solutions/rest/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrLdapLoginId: process.env.N8N_EMAIL,
      password: process.env.N8N_PASSWORD,
    }),
  });
  return (login.headers.getSetCookie?.() || [])
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function main() {
  const cookie = await n8nCookie();
  const wf = (
    await (
      await fetch(`https://n8n.ritz-ai.solutions/rest/workflows/${WORKFLOW_ID}`, {
        headers: { Cookie: cookie },
      })
    ).json()
  ).data;

  const normalize = wf.nodes.find((n) => n.name === NORMALIZE_NODE_NAME);
  const dup = wf.nodes.find((n) => n.name === "Duplicate Check");
  const raw = wf.nodes.find((n) => n.name === "Raw Email");
  if (!normalize || !dup || !raw) throw new Error("nodes missing");

  normalize.parameters.jsCode = NORMALIZE_CODE;
  dup.parameters.filters.conditions[0].keyValue = "={{ $json.resolvedMessageId }}";
  raw.parameters.fieldsUi.fieldValues.find((f) => f.fieldId === "message_id").fieldValue =
    "={{ $('Normalize Message ID').item.json.resolvedMessageId }}";

  const patch = await fetch(
    `https://n8n.ritz-ai.solutions/rest/workflows/${WORKFLOW_ID}`,
    {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: wf.settings,
        staticData: wf.staticData,
      }),
    },
  );
  console.log("patch", patch.status, (await patch.text()).slice(0, 120));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
