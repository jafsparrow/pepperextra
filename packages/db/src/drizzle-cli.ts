import { drizzle } from "drizzle-orm/node-postgres"

export const db = drizzle(process.env.PEPPER_DATABASE_URL!)
