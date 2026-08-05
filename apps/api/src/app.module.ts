import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PlanetController } from './planet/planet.controller.js';
import { onError, ORPCError, ORPCModule } from '@orpc/nest';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

import { AuthInstance, createAuthInstance } from '@repo/auth';
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from '@orpc/server/plugins';
import { DatabaseModule, DRIZZLE_TOKEN } from './db/database.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseClient } from '@repo/db';
import { UserModule } from './user/user.module.js';
import { OrganizationUserModule } from './organization-user/organization-user.module.js';
import { OrganizationSettingsModule } from './organization-settings/organization-settings.module.js';
import { TeamSettingsModule } from './team-settings/team-settings.module.js';
import { BranchModule } from './branch/branch.module.js';
import { ProductGroupModule } from './product-group/product-group.module.js';
import { ProductModule } from './product/product.module.js';
import { CategoryModule } from './category/category.module.js';
import { SupplierModule } from './supplier/supplier.module.js';
import { CustomerModule } from './customer/customer.module.js';
import { PriceListModule } from './price-list/price-list.module.js';
import { APIError } from 'better-auth';
import { CountriesModule } from './countries/countries.module.js';

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
    UserModule,
    OrganizationUserModule,
    OrganizationSettingsModule,
    TeamSettingsModule,
    BranchModule,
    ProductGroupModule,
    ProductModule,
    CategoryModule,
    SupplierModule,
    CustomerModule,
    PriceListModule,
    CountriesModule,

    // 3. Register Auth Module Asynchronously
    AuthModule.forRootAsync({
      imports: [DatabaseModule], // Brings in the DRIZZLE_TOKEN provider
      inject: [DRIZZLE_TOKEN, ConfigService], // 💡 Inject both dependencies
      useFactory: (
        dbClient: DatabaseClient,
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
          // Dev stub: no email provider wired up yet. Logs the reset URL/token
          // so password-reset flows can be exercised locally.
          async sendResetPassword({ user, url, token }) {
            console.log(`[auth:sendResetPassword] user=${user.email} token=${token}`);
            console.log(`[auth:sendResetPassword] reset URL: ${url}`);
          },
          allowUserToCreateOrganization(user) {
            // custome field typing are missing from the object.
            const typedUser = user as typeof user & {
              customAccountType?: string;
            };
            console.log('user passed is ', JSON.stringify(user));
            return typedUser.customAccountType === 'owner';
          },
          organizationHooks: {
            async beforeCreateOrganization({ organization, user }) {
              const existingOrgs = await dbClient.query.member.findMany({
                where: { userId: user.id },
                limit: 1,
              });

              if (existingOrgs.length > 0) {
                // [NOTE] better auth apiError will send formated response, normal error won't send any response.
                throw new APIError('BAD_REQUEST', {
                  message: 'User already belongs to an organization',
                });
              }

              return { data: { ...organization } };
            },
          },
          teamHooks: {
            async beforeCreateTeam(data) {
              const existingOrgs = await dbClient.query.member.findMany({
                where: { userId: '1' },
                limit: 1,
              });

              // Pseudo: look up the organization's license/plan
              // const license = await dbClient.query.license.findFirst({
              //   where: { organizationId: organization.id },
              // });

              // const plan = license?.plan ?? 'basic';

              // if (plan === 'basic') {
              //   const teamCount = await dbClient.query.team.findMany({
              //     where: { organizationId: organization.id },
              //   });

              //   if (teamCount.length >= 1) {
              //     throw new APIError('BAD_REQUEST', {
              //       message:
              //         'Basic plan allows only one team (location). Upgrade to Pro to create more.',
              //     });
              //   }
              // }

              return { data };
            },
          },
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
