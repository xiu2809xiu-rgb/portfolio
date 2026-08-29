import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

/*
  `dotenv/config` reads `.env` only, and this project keeps its secrets in
  `.env.local` the way Next does — so `db:migrate` used to run with an empty
  connection string unless you exported DATABASE_URL into the shell first. Both
  files are read now, `.env.local` winning, which matches Next's own precedence.
*/
config({ path: ['.env.local', '.env'] });

export default defineConfig({
  schema: './src/infrastructure/persistence/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? '',
  },
  verbose: true,
  strict: true,
});
