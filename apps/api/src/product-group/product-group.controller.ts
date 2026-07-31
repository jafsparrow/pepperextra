import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { ProductGroupService } from './product-group.service.js';

@Controller()
export class ProductGroupController {
  constructor(private readonly productGroupService: ProductGroupService) {}

  @Implement(contracts.productGroup.list)
  list() {
    return implement(contracts.productGroup.list).handler(async ({ input }) => {
      return this.productGroupService.listProductGroups(input.organizationId);
    });
  }

  @Implement(contracts.productGroup.create)
  create() {
    return implement(contracts.productGroup.create).handler(
      async ({ input }) => {
        const { organizationId, ...data } = input;
        return this.productGroupService.createProductGroup(
          organizationId,
          data,
        );
      },
    );
  }

  @Implement(contracts.productGroup.update)
  update() {
    return implement(contracts.productGroup.update).handler(
      async ({ input }) => {
        const { organizationId: _organizationId, id, ...data } = input;
        console.log(_organizationId);
        return this.productGroupService.updateProductGroup(id, data);
      },
    );
  }

  @Implement(contracts.productGroup.delete)
  delete() {
    return implement(contracts.productGroup.delete).handler(
      async ({ input }) => {
        await this.productGroupService.deleteProductGroup(input.id);
        return { success: true };
      },
    );
  }
}
