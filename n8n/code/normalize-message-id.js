/**
 * n8n Code node: Normalize Message ID
 * Paste into workflow between IMAP Trigger and Duplicate Check.
 *
 * PostgREST/Supabase filters break on spaces, brackets, parentheses in eq values.
 * Fallback IDs must be ASCII-only (hash), not subject+date strings.
 */
function hashFallback(seed) {
  let h1 = 5381;
  let h2 = 52711;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 33) ^ c;
  }
  return `pastler-fallback-${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}@import.local`;
}

function sanitizeMessageId(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return null;
  }
  let id = String(raw).trim();
  if (id.startsWith("<") && id.endsWith(">")) {
    id = id.slice(1, -1).trim();
  }
  if (/^[A-Za-z0-9@._+-]+$/.test(id)) {
    return id;
  }
  return hashFallback(id);
}

return $input.all().map((item) => {
  const j = item.json;
  const fromAddr =
    j.from?.value?.[0]?.address || j.from?.address || "unknown";
  const seed = `${j.subject || "no-subject"}|${j.date || ""}|${fromAddr}`;
  const resolvedMessageId = sanitizeMessageId(j.messageId) || hashFallback(seed);
  return { json: { ...j, resolvedMessageId } };
});
