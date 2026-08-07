import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { orgCatalogVersions } from '@repo/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class CatalogVersionInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const organizationId = this.extractOrganizationId(
      request.originalUrl ?? request.url,
    );

    if (organizationId) {
      try {
        const [row] = await this.db
          .select({ version: orgCatalogVersions.version })
          .from(orgCatalogVersions)
          .where(eq(orgCatalogVersions.orgId, organizationId));

        response.setHeader('X-Catalog-Version', String(row?.version ?? 1));
      } catch {
        // A failed version lookup must never block the request.
      }
    }

    return next.handle();
  }

  private extractOrganizationId(url: string): string | null {
    const match = /\/organizations\/([^/?]+)\//.exec(url);
    return match?.[1] ?? null;
  }
}
