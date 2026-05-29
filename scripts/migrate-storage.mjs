/**
 * One-time migration: moves files from {userId}/ay{YYYY}/documents/ → ay{YYYY}/documents/
 *
 * Usage:
 *   1. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env
 *   2. node scripts/migrate-storage.mjs        ← dry run
 *   3. node scripts/migrate-storage.mjs --run  ← actually moves files
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envVars = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env"), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BUCKET = "parent-portal";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DRY_RUN = !process.argv.includes("--run");

// Files that need a destination different from the default strip-UUID logic.
// E260519 was transferred from ay2027 → ay2026, so its file must land in ay2026.
const OVERRIDES = {
  "c13d54f3-5f19-4bcd-ba40-d2d266fc453a/ay2027/documents/1779337506355-ASP Medical Exemination.pdf":
    "ay2026/documents/1779337506355-ASP Medical Exemination.pdf",
};

async function list(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list("${prefix}"): ${error.message}`);
  return data ?? [];
}

async function move(from, to) {
  const { error } = await supabase.storage.from(BUCKET).move(from, to);
  if (error) throw new Error(`move("${from}" → "${to}"): ${error.message}`);
}

async function main() {
  if (DRY_RUN) console.log("DRY RUN — no files will be moved. Pass --run to execute.\n");

  // Step 1: find UUID folders at root
  const root = await list("");
  console.log(
    "Root items:",
    root.map((i) => i.name),
  );

  const uuidFolders = root.filter((item) => UUID_RE.test(item.name));
  console.log(`\nMatched ${uuidFolders.length} userId folder(s)\n`);

  let count = 0;
  let failed = 0;

  for (const uuidFolder of uuidFolders) {
    const ayFolders = await list(uuidFolder.name);

    for (const ayFolder of ayFolders) {
      if (!/^ay\d{4}$/.test(ayFolder.name)) {
        console.log(`  [skip] ${uuidFolder.name}/${ayFolder.name} — not an ay folder`);
        continue;
      }

      const subFolders = await list(`${uuidFolder.name}/${ayFolder.name}`);

      for (const subFolder of subFolders) {
        const files = await list(`${uuidFolder.name}/${ayFolder.name}/${subFolder.name}`);

        for (const file of files) {
          const oldPath = `${uuidFolder.name}/${ayFolder.name}/${subFolder.name}/${file.name}`;
          const defaultPath = `${ayFolder.name}/${subFolder.name}/${file.name}`;
          const newPath = OVERRIDES[oldPath] ?? defaultPath;
          const isOverride = newPath !== defaultPath;

          if (DRY_RUN) {
            console.log(`  [dry]${isOverride ? " [OVERRIDE]" : ""} ${oldPath} → ${newPath}`);
            count++;
          } else {
            try {
              await move(oldPath, newPath);
              console.log(`  ✓${isOverride ? " [OVERRIDE]" : ""} ${oldPath} → ${newPath}`);
              count++;
            } catch (err) {
              console.error(`  ✗ ${err.message}`);
              failed++;
            }
          }
        }
      }
    }
  }

  console.log(
    DRY_RUN ? `\nDry run complete. ${count} file(s) would be moved.` : `\nDone. Moved: ${count}, Failed: ${failed}`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
