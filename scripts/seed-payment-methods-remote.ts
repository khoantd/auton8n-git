/**
 * Inserts payment method types into remote Supabase app.payment_types.
 * Skips any method that already exists (by name).
 *
 * Env: .env with SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Run: npm run seed:payment-methods-remote
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

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

const PAYMENT_METHODS = [
  { name: "Stripe", description: "Accept all major credit cards and digital wallets.", is_enabled: true },
  { name: "PayPal", description: "Secure payments via PayPal balance or linked cards.", is_enabled: true },
  { name: "QR Code", description: "Scan and pay via QR code or upload proof of payment.", is_enabled: true },
  { name: "Crypto", description: "Accept Bitcoin, Ethereum, and other major tokens.", is_enabled: false },
];

async function main() {
  const { data: existing } = await supabase.from("payment_types").select("name");
  const existingNames = new Set((existing ?? []).map((r) => r.name));

  let inserted = 0;
  for (const row of PAYMENT_METHODS) {
    if (existingNames.has(row.name)) {
      console.log("Skip (exists):", row.name);
      continue;
    }
    const { error } = await supabase.from("payment_types").insert(row);
    if (error) {
      console.error("Insert failed for", row.name, error.message);
      process.exit(1);
    }
    console.log("Inserted:", row.name);
    inserted++;
  }
  console.log("Done. Inserted", inserted, "payment method(s) into remote Supabase.");
}

main();
