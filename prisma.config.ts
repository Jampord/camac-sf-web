import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need Neon's direct (unpooled) connection; the app uses the pooled DATABASE_URL.
    // Falls back to "" so `prisma generate` works without a database (fresh clone, CI).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
