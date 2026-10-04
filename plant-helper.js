// ============================================================
// Plant helper: a tiny program that runs on Cloudflare (in the cloud), NOT on the phone.
//
// Why it exists: the Pl@ntNet key must stay secret. So the key lives here, locked
// inside Cloudflare. The app sends the photo to this helper, the helper adds the
// key and asks Pl@ntNet, then passes the answer back. Nothing is saved.
//
// Setup (an adult does this once): see README.md, "Set up the plant helper".
// Cloudflare settings it needs:
//   PLANTNET_KEY  (Secret)  the Pl@ntNet key
//   ALLOWED_SITES (Text)    websites allowed to use this helper, separated by commas,
//                           like: https://USERNAME.github.io,http://localhost:8000
// ============================================================

// The one place this helper is allowed to send photos.
const PLANTNET_URL = "https://my-api.plantnet.org/v2/identify/all?lang=en&nb-results=3&api-key=";

// The biggest photo we accept. The app shrinks photos to much less than this.
const MAX_BYTES = 5 * 1024 * 1024;

// The headers that tell the browser "yes, this website may read my answer".
function allowHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

// Send back an answer with a status number (like 200 = OK, 403 = not allowed).
function reply(status, message, origin) {
  const body = message ? JSON.stringify({ message }) : null;
  return new Response(body, { status, headers: allowHeaders(origin) });
}

// Cloudflare runs this every time the app sends a request.
async function handleRequest(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedSites = (env.ALLOWED_SITES || "").split(",").map((site) => site.trim());
  // Not on the list? Say no. (The browser may still read this "no", so the app can explain it.)
  if (!allowedSites.includes(origin)) return reply(403, "This website isn't allowed to use the plant helper.", origin);
  if (request.method === "OPTIONS") return reply(204, null, origin); // the browser asking "may I?" first
  if (request.method !== "POST") return reply(405, "Send a photo with POST.", origin);
  if (!env.PLANTNET_KEY) return reply(500, "The plant helper has no Pl@ntNet key yet.", origin);

  const photo = await request.arrayBuffer();
  if (photo.byteLength === 0 || photo.byteLength > MAX_BYTES) return reply(413, "The photo is missing or too big.", origin);
  try {
    const answer = await fetch(PLANTNET_URL + encodeURIComponent(env.PLANTNET_KEY), {
      method: "POST",
      headers: { "Content-Type": request.headers.get("Content-Type") || "" },
      body: photo,
    });
    return new Response(answer.body, { status: answer.status, headers: allowHeaders(origin) });
  } catch {
    return reply(502, "The plant helper couldn't reach Pl@ntNet.", origin);
  }
}

export default { fetch: handleRequest };
