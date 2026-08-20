// Cursis Platform — Prisma 7 Configuration
// Datasource URL is configured here (not in schema.prisma).

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
