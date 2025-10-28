import { storage } from "./storage";

async function run() {
  try {
    console.log("Running DB-backed smoke test: verifying seeded payments for daycareId=1...");
    // Query payments for daycareId=1 (seed uses daycare id 1)
    const rows = await storage.getPayments(undefined, undefined, 1);
    const count = Array.isArray(rows) ? rows.length : 0;
    console.log(`Found ${count} payment(s)`);
    if (count >= 3) {
      console.log("✅ Smoke test passed: seeded payments are present.");
      process.exit(0);
    } else {
      console.error("❌ Smoke test failed: expected at least 3 seeded payments.");
      if (count > 0) console.error("Payment rows:", JSON.stringify(rows, null, 2));
      process.exit(2);
    }
  } catch (err) {
    console.error("Error running smoke test:", err);
    process.exit(3);
  }
}

run();
