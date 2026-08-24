/**
 * One-off helper: exchange a Google OAuth consent for a long-lived refresh token.
 *
 *   1. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 *   2. node scripts/google-auth.mjs
 *   3. Open the printed URL, approve, and the token is captured automatically
 *
 * Spins up a throwaway localhost server to catch the redirect, so nothing has to
 * be pasted by hand. The token it prints is the only credential the site needs to
 * read free/busy and create invites on your calendar.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const PORT = 5813;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

/** Read-only free/busy plus the ability to create the booking events themselves. */
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match) env[match[1]] ??= match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env.local is optional if the values are already exported.
  }
  return env;
}

const env = loadEnv();
const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(`
Missing credentials.

Add these to .env.local first (from console.cloud.google.com → APIs & Services
→ Credentials → OAuth client ID → Web application):

  GOOGLE_CLIENT_ID=...apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-...

And register this exact redirect URI on that OAuth client:

  ${REDIRECT_URI}
`);
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    // `offline` + `consent` together are what guarantee a refresh_token comes
    // back; without `consent` Google omits it on a repeat authorisation.
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);
  if (url.pathname !== '/oauth2callback') {
    response.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get('error');
  if (error) {
    response.writeHead(400, { 'Content-Type': 'text/html' }).end(page('Denied', error));
    console.error('\nAuthorisation denied:', error);
    server.close();
    process.exit(1);
  }

  const code = url.searchParams.get('code');
  if (!code) {
    response.writeHead(400).end('missing code');
    return;
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.refresh_token) {
      response
        .writeHead(400, { 'Content-Type': 'text/html' })
        .end(page('No refresh token', 'Revoke access at myaccount.google.com/permissions and retry.'));
      console.error('\nGoogle returned no refresh_token:', tokens);
      server.close();
      process.exit(1);
    }

    response
      .writeHead(200, { 'Content-Type': 'text/html' })
      .end(page('All set', 'Refresh token captured. You can close this tab.'));

    console.log(`
✓ Refresh token captured. Add this to .env.local and to Vercel:

GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}

Then set (if you have not already):

GOOGLE_CALENDAR_ID=primary
BOOKING_OWNER_EMAIL=your@gmail.com
`);
  } catch (thrown) {
    console.error('Token exchange failed:', thrown);
    response.writeHead(500).end('token exchange failed');
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 200);
  }
});

const page = (title, body) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui;background:#05070a;color:#e9ecef;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1 style="color:#b4ff39;margin:0 0 8px">${title}</h1><p style="color:#8b949e">${body}</p></div>
</body></html>`;

server.listen(PORT, () => {
  console.log(`\nOpen this URL to authorise:\n\n${authUrl}\n\nWaiting on ${REDIRECT_URI} …`);
});
