import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

function fail(message) {
  console.error(`[supabase] ${message}`);
  process.exit(1);
}

function matchValue(content, pattern, label) {
  const value = content.match(pattern)?.[1];
  if (!value) fail(`Could not read ${label}.`);
  return value;
}

let env;
let wrangler;
let config;
let clientProject;
try {
  env = parseEnv(readFileSync(".env", "utf8"));
  wrangler = readFileSync("wrangler.jsonc", "utf8");
  config = readFileSync("supabase/config.toml", "utf8");
  clientProject = readFileSync("src/integrations/supabase/project.ts", "utf8");
} catch {
  fail("Could not read the Supabase configuration files.");
}

const serverUrl = env.SUPABASE_URL;
const serverKey = env.SUPABASE_PUBLISHABLE_KEY;
const clientKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const projectId = matchValue(
  config,
  /project_id\s*=\s*"([^"]+)"/,
  "supabase/config.toml project ID",
);
const clientProjectId = matchValue(
  clientProject,
  /SUPABASE_PROJECT_ID\s*=\s*"([^"]+)"/,
  "client project ID",
);
const wranglerUrl = matchValue(wrangler, /"SUPABASE_URL"\s*:\s*"([^"]+)"/, "wrangler URL");
const wranglerKey = matchValue(
  wrangler,
  /"SUPABASE_PUBLISHABLE_KEY"\s*:\s*"([^"]+)"/,
  "wrangler publishable key",
);

if (!serverUrl || !serverKey || !clientKey) {
  fail("Missing URL or publishable key configuration.");
}

if (serverKey !== clientKey || serverKey !== wranglerKey) {
  fail("Supabase publishable keys do not match across environments.");
}

if (clientKey.startsWith("sb_secret_")) {
  fail("A secret key was placed in a public environment variable.");
}

if (projectId !== clientProjectId) {
  fail("Client and Supabase CLI project IDs do not match.");
}

let parsedUrl;
try {
  parsedUrl = new URL(serverUrl);
} catch {
  fail("The configured Supabase URL is invalid.");
}

if (
  parsedUrl.protocol !== "https:" ||
  parsedUrl.hostname !== `${projectId}.supabase.co` ||
  serverUrl !== wranglerUrl
) {
  fail("The Supabase URLs and project ID do not match.");
}

let settingsResponse;
try {
  settingsResponse = await fetch(new URL("/auth/v1/settings", parsedUrl), {
    headers: {
      apikey: clientKey,
      authorization: `Bearer ${clientKey}`,
    },
  });
} catch {
  fail("Could not reach Supabase. Check the network and project URL.");
}

if (!settingsResponse.ok) {
  fail(`Supabase rejected the publishable key (HTTP ${settingsResponse.status}).`);
}

const settings = await settingsResponse.json();
if (settings.disable_signup === true) {
  fail("Email signup is disabled in Supabase Auth.");
}

console.log(
  `[supabase] Project ${projectId}: publishable key accepted; email signup enabled; Google OAuth ${(settings.external?.google ?? settings.external_google) ? "enabled" : "disabled"}.`,
);
