import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback on .env

export default defineConfig({
  schema: "./server/db/schema",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
