/**
 * Updates existing workflow rows in Supabase with workflow_json, instructions,
 * and video_url from src/data/workflows (via workflow-demo-payload.json).
 *
 * Prerequisites:
 * - workflows table has workflow_json, instructions, video_url columns
 * - Workflows "Build Your First AI Agent" and "Personal Life Manager..." must exist (e.g. from seed_data.sql)
 *
 * Env: .env with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended; bypasses RLS).
 *      Or VITE_SUPABASE_ANON_KEY if your user is an admin.
 *
 * Run: npm run seed:workflow-demo
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const payloadPath = join(__dirname, "workflow-demo-payload.json");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing env. In .env set:\n  VITE_SUPABASE_URL=...\n  SUPABASE_SERVICE_ROLE_KEY=... (Project Settings > API in Supabase dashboard)\nOr VITE_SUPABASE_ANON_KEY=... if you use an admin user."
  );
  process.exit(1);
}

const supabase = createClient(url, key, { db: { schema: 'app' } });

type PayloadItem = {
  title: string;
  workflow_json: string;
  instructions: string | null;
  video_url: string | null;
};

const payload: PayloadItem[] = JSON.parse(
  readFileSync(payloadPath, "utf-8")
);

function normalizeTitle(t: string) {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  // Fetch all workflows so we can match by title and update by id (avoids exact-title issues)
  const { data: workflows, error: fetchError } = await supabase
    .from("workflows")
    .select("id, title");

  if (fetchError) {
    console.error("Failed to fetch workflows:", fetchError.message);
    process.exit(1);
  }
  if (!workflows?.length) {
    console.error("No workflows in database. Run seed_data.sql first to insert workflow rows.");
    process.exit(1);
  }

  const byNormalizedTitle = new Map<string | undefined, { id: string; title: string }>();
  for (const w of workflows) {
    byNormalizedTitle.set(normalizeTitle(w.title), { id: w.id, title: w.title });
  }

  let updated = 0;
  for (const row of payload) {
    const key = normalizeTitle(row.title);
    const match = byNormalizedTitle.get(key);
    if (!match) {
      console.error(
        "No workflow matched title:",
        JSON.stringify(row.title),
        "\nExisting titles (first 5):",
        workflows.slice(0, 5).map((w) => JSON.stringify(w.title)).join(", ")
      );
      process.exit(1);
    }

    const { data, error } = await supabase
      .from("workflows")
      .update({
        workflow_json: row.workflow_json,
        instructions: row.instructions,
        video_url: row.video_url,
      })
      .eq("id", match.id)
      .select("id");

    if (error) {
      console.error("Update failed for", row.title, error.message);
      if (error.code === "42501" || error.message.includes("policy") || error.message.includes("row-level")) {
        console.error("Hint: use SUPABASE_SERVICE_ROLE_KEY (not anon key) to bypass RLS.");
      }
      process.exit(1);
    }
    if (!data?.length) {
      console.error("Update matched 0 rows for id:", match.id);
      process.exit(1);
    }
    console.log("Updated:", match.title);
    updated++;
  }
  console.log("Done. Migrated", updated, "workflow(s) with demo data.");
}

main();
