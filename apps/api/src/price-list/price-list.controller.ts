import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { PriceListService } from './price-list.service.js';

@Controller()
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Implement(contracts.priceList.list)
  list() {
    return implement(contracts.priceList.list).handler(async ({ input }) => {
      return this.priceListService.listPriceLists(input.organizationId);
    });
  }

  @Implement(contracts.priceList.get)
  get() {
    return implement(contracts.priceList.get).handler(async ({ input }) => {
      return this.priceListService.getPriceList(input.organizationId, input.id);
    });
  }

  @Implement(contracts.priceList.create)
  create() {
    return implement(contracts.priceList.create).handler(async ({ input }) => {
      const { organizationId, ...data } = input;
      return this.priceListService.createPriceList(organizationId, data);
    });
  }

  @Implement(contracts.priceList.update)
  update() {
    return implement(contracts.priceList.update).handler(async ({ input }) => {
      const { organizationId, id, ...data } = input;
      return this.priceListService.updatePriceList(organizationId, id, data);
    });
  }

  @Implement(contracts.priceList.delete)
  delete() {
    return implement(contracts.priceList.delete).handler(async ({ input }) => {
      await this.priceListService.deletePriceList(
        input.organizationId,
        input.id,
      );
      return { success: true };
    });
  }

  @Implement(contracts.priceList.addOverride)
  addOverride() {
    return implement(contracts.priceList.addOverride).handler(
      async ({ input }) => {
        const { organizationId, id, ...data } = input;
        return this.priceListService.addOverride(organizationId, id, data);
      },
    );
  }

  @Implement(contracts.priceList.updateOverride)
  updateOverride() {
    return implement(contracts.priceList.updateOverride).handler(
      async ({ input }) => {
        const { organizationId, id, productId, ...data } = input;
        return this.priceListService.updateOverride(
          organizationId,
          id,
          productId,
          data,
        );
      },
    );
  }

  @Implement(contracts.priceList.removeOverride)
  removeOverride() {
    return implement(contracts.priceList.removeOverride).handler(
      async ({ input }) => {
        await this.priceListService.removeOverride(
          input.organizationId,
          input.id,
          input.productId,
        );
        return { success: true };
      },
    );
  }

  @Implement(contracts.priceList.resolve)
  resolve() {
    return implement(contracts.priceList.resolve).handler(async ({ input }) => {
      return this.priceListService.resolveProductPrice(input.organizationId, {
        productId: input.productId,
        customerId: input.customerId,
        priceListId: input.priceListId,
      });
    });
  }

  @Implement(contracts.priceList.resolveMany)
  resolveMany() {
    return implement(contracts.priceList.resolveMany).handler(
      async ({ input }) => {
        return this.priceListService.resolveProductPrices(
          input.organizationId,
          {
            productIds: input.productIds,
            customerId: input.customerId,
            priceListId: input.priceListId,
          },
        );
      },
    );
  }
}
