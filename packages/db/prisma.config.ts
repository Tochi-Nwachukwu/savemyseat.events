import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// One .env at the repo root is shared by every package.
config({ path: "../../.env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need the direct (non-pooled) connection; Neon pulls it as DATABASE_URL_UNPOOLED.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
