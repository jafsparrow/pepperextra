import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AuthInstance, createAuthInstance } from '@pepperextra/auth';
import { PlanetController } from './planet/planet.controller.js';
import { onError, ORPCError, ORPCModule } from '@orpc/nest';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from '@orpc/server/plugins';
import { DatabaseModule, DRIZZLE_TOKEN } from './db/database.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

declare module '@orpc/nest' {
  interface ORPCGlobalContext {
    request: Request;
  }
}
@Module({
  imports: [
    // AuthModule.forRoot({ auth }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '../../.env'],
    }),
    DatabaseModule,

    // 3. Register Auth Module Asynchronously
    AuthModule.forRootAsync({
      imports: [DatabaseModule], // Brings in the DRIZZLE_TOKEN provider
      inject: [DRIZZLE_TOKEN, ConfigService], // 💡 Inject both dependencies
      useFactory: (
        dbClient: NodePgDatabase<any>,
        configService: ConfigService,
      ): { auth: AuthInstance } => {
        // Read any auth-specific environment variables required at runtime
        const secret = configService.get<string>('BETTER_AUTH_SECRET');
        const baseUrl = configService.get<string>('BETTER_AUTH_URL');

        console.log('BETTER_AUTH_SECRET from config service', secret);
        if (!secret || !baseUrl) {
          throw new Error(
            'Missing critical Better Auth environment configuration variables!',
          );
        }

        const betterAuthInstance = createAuthInstance(dbClient, {
          secret,
          baseUrl,
        });
        return {
          // 💡 Pass the live database client and runtime variables to your auth builder
          auth: betterAuthInstance,
        };
      },
    }),
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        context: {
          request,
        },
        interceptors: [
          onError((error) => {
            console.log(error);
          }),
        ],
        plugins: [
          new RethrowHandlerPlugin({
            filter: (error) => {
              // Rethrow all non-ORPCError errors
              // This allows unhandled exceptions to bubble up to NestJS global exception filters
              return !(error instanceof ORPCError);
            },
          }),
        ],
      }),
      inject: [REQUEST],
    }),
  ],
  controllers: [AppController, PlanetController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('AppModule initialized');
  }
}
