import { drizzle } from "drizzle-orm/node-postgres"

// NOTE: This file is used by the Drizzle cli to generate the database schema. It should not be used in production code.
export const db = drizzle(process.env.PEPPER_DATABASE_URL!)
