import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { CatalogService } from './catalog.service.js';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Implement(contracts.catalog.getVersion)
  getVersion() {
    return implement(contracts.catalog.getVersion).handler(async ({ input }) =>
      this.catalogService.getVersion(input.organizationId),
    );
  }

  @Implement(contracts.catalog.sync)
  sync() {
    return implement(contracts.catalog.sync).handler(async ({ input }) =>
      this.catalogService.sync(input.organizationId, input.since, input.teamId),
    );
  }

  @Implement(contracts.catalog.getStock)
  getStock() {
    return implement(contracts.catalog.getStock).handler(async ({ input }) =>
      this.catalogService.getStock(input.organizationId, input.teamId),
    );
  }

  @Implement(contracts.catalog.revalidate)
  revalidate() {
    return implement(contracts.catalog.revalidate).handler(async ({ input }) =>
      this.catalogService.revalidate(
        input.organizationId,
        input.teamId,
        input.skuIds,
      ),
    );
  }
}
