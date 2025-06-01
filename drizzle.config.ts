import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema-sqlite.ts", // ✅ your converted schema file
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./server/db.sqlite", // ✅ your DB location
  },
} satisfies Config;