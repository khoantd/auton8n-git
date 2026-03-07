/**
 * One-off: writes workflow_json, instructions, video_url for workflows that have
 * workflowJson to scripts/workflow-demo-payload.json for use by seed-workflow-demo.
 * Run from project root: npx tsx scripts/generate-demo-payload.ts
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
// @ts-expect-error - path alias resolved by tsx/tsconfig
import { workflows } from "../src/data/workflows.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "workflow-demo-payload.json");

const payload = workflows
  .filter((w) => w.workflowJson)
  .map((w) => ({
    title: w.title,
    workflow_json: w.workflowJson,
    instructions: w.instructions ?? null,
    video_url: w.videoUrl ?? null,
  }));

writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
console.log("Wrote", payload.length, "workflow(s) to", outPath);
