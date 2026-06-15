import { mkdir, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const databaseUrl = process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error("Missing SUPABASE_DB_URL.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.resolve("backups");
const outputFile = path.join(outputDir, `focovest-${stamp}.dump`);
await mkdir(outputDir, { recursive: true });

const args = [
  "--dbname",
  databaseUrl,
  "--format=custom",
  "--no-owner",
  "--no-privileges",
  "--file",
  outputFile,
];

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn("pg_dump", args, { stdio: "inherit", shell: false });
  child.on("error", reject);
  child.on("close", resolve);
});

if (exitCode !== 0) process.exit(Number(exitCode) || 1);
const info = await stat(outputFile);
if (info.size < 1024) {
  console.error("Backup file is unexpectedly small.");
  process.exit(1);
}

console.log(outputFile);
