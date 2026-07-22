import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createDatabaseClient, DatabaseClient } from '@pepperextra/db';
export const DRIZZLE_TOKEN = 'DRIZZLE_CLIENT';
@Module({
  providers: [
    {
      provide: DRIZZLE_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DatabaseClient => {
        const url = configService.get<string>('PEPPER_DATABASE_URL');
        console.log('database url from config service', url);
        if (!url)
          throw new Error(
            'PEPPER_DATABASE_URL is missing from environment layout!',
          );
        return createDatabaseClient(url);
      },
    },
  ],
  exports: [DRIZZLE_TOKEN],
})
export class DatabaseModule {
  constructor() {
    console.log('DatabaseModule initialized');
  }
}
