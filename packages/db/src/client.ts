import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
// console.log("procees env values", process.env)cls

// Export a builder function instead of a global constant instance
export const createDatabaseClient = (connectionString: string) => {
  console.log(
    "creating database client with connection string",
    connectionString
  )
  return drizzle(connectionString)
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>

// Reading the process env values from inside the package cannot find the env values from the root package,
// so we need to read the env values from the root package and pass it to the db package. we could use dontenv package
// to read the env values from the root package and pass it to the db package, but we will just read the env values
// from the root package and pass it to the db package for now. another option is let nest js config module
// to read the env values from the root package and pass it to the db package,
//  but we will just read the env values,it should be loaded as dynamically from the root package
//  and pass it to the db package for now. another option is let nest js config module

// const dbUrl = process.env.PEPPER_DATABASE_URL
// if (!dbUrl) console.error("no db url got from the env files")

// // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// export const db = drizzle(process.env.PEPPER_DATABASE_URL!)

// Export a builder function instead of a global constant instance
// export const createDatabaseClient = (connectionString: string) => {
//   const pool = new Pool({ connectionString });
//   return drizzle(pool, { schema });
// };

//  providers: [
//     {
//       provide: DRIZZLE_TOKEN,
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => {
//         const url = configService.get<string>('DATABASE_URL');
//         if (!url) throw new Error('DATABASE_URL is missing from environment layout!');
//         return createDatabaseClient(url);
//       },
//     },
//   ],
