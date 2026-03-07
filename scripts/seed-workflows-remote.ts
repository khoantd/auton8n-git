/**
 * Inserts sample workflows into remote Supabase app.workflows.
 * Merges in workflow_json, instructions, video_url from workflow-demo-payload.json where titles match.
 *
 * Env: .env with SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Run: npm run seed:workflows-remote
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "seed-workflows-data.json");
const payloadPath = join(__dirname, "workflow-demo-payload.json");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing env. In .env set:\n  SUPABASE_URL=... (or VITE_SUPABASE_URL)\n  SUPABASE_SERVICE_ROLE_KEY=... (Project Settings > API)"
  );
  process.exit(1);
}

const supabase = createClient(url, key, { db: { schema: "app" } });

type WorkflowRow = {
  title: string;
  description: string;
  author_name: string;
  author_avatar: string;
  category: string;
  integrations: string[];
  views: number;
  featured: boolean;
  is_pro: boolean;
  price: number;
};

type DemoPayloadItem = {
  title: string;
  workflow_json: string;
  instructions: string | null;
  video_url: string | null;
};

function normalizeTitle(t: string) {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  const rows: WorkflowRow[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  const payload: DemoPayloadItem[] = JSON.parse(
    readFileSync(payloadPath, "utf-8")
  );
  const demoByTitle = new Map<string, DemoPayloadItem>();
  for (const p of payload) {
    demoByTitle.set(normalizeTitle(p.title), p);
  }

  let inserted = 0;
  for (const row of rows) {
    const demo = demoByTitle.get(normalizeTitle(row.title));
    const record = {
      title: row.title,
      description: row.description,
      author_name: row.author_name,
      author_avatar: row.author_avatar,
      category: row.category,
      integrations: row.integrations,
      views: row.views,
      featured: row.featured,
      is_pro: row.is_pro,
      price: row.price,
      ...(demo && {
        workflow_json: demo.workflow_json,
        instructions: demo.instructions,
        video_url: demo.video_url,
      }),
    };

    const { error } = await supabase.from("workflows").insert(record);

    if (error) {
      console.error("Insert failed for", row.title, error.message);
      process.exit(1);
    }
    console.log("Inserted:", row.title);
    inserted++;
  }
  console.log("Done. Inserted", inserted, "workflow(s) into remote Supabase.");
}

main();
