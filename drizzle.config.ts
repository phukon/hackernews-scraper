import dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "mysql",
  schema: "./src/schema",
  out: "./src/migrations",
  dbCredentials: {
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    database: process.env.DB_NAME as string,
    password: process.env.DB_PASSWORD as string,
    port: 3306
  },
  verbose: true,
  strict: true,
});
