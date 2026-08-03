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
        const { organizationId, id, ...data } = input;
        return this.productGroupService.updateProductGroup(
          organizationId,
          id,
          data,
        );
      },
    );
  }

  @Implement(contracts.productGroup.delete)
  delete() {
    return implement(contracts.productGroup.delete).handler(
      async ({ input }) => {
        await this.productGroupService.deleteProductGroup(
          input.organizationId,
          input.id,
        );
        return { success: true };
      },
    );
  }

  @Implement(contracts.productGroup.listProducts)
  listProducts() {
    return implement(contracts.productGroup.listProducts).handler(
      async ({ input }) => {
        return this.productGroupService.listGroupProducts(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.productGroup.detail)
  detail() {
    return implement(contracts.productGroup.detail).handler(
      async ({ input }) => {
        return this.productGroupService.getProductGroupDetail(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.productGroup.addProduct)
  addProduct() {
    return implement(contracts.productGroup.addProduct).handler(
      async ({ input }) => {
        return this.productGroupService.addProductToGroup(
          input.organizationId,
          input.id,
          input.productId,
        );
      },
    );
  }

  @Implement(contracts.productGroup.removeProduct)
  removeProduct() {
    return implement(contracts.productGroup.removeProduct).handler(
      async ({ input }) => {
        return this.productGroupService.removeProductFromGroup(
          input.organizationId,
          input.id,
          input.productId,
        );
      },
    );
  }
}
