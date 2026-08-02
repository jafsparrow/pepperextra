import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { ProductService } from './product.service.js';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Implement(contracts.product.list)
  list() {
    return implement(contracts.product.list).handler(async ({ input }) => {
      return this.productService.listProducts(input);
    });
  }

  @Implement(contracts.product.create)
  create() {
    return implement(contracts.product.create).handler(async ({ input }) => {
      const { organizationId, ...data } = input;
      return this.productService.createProduct(organizationId, data);
    });
  }

  @Implement(contracts.product.update)
  update() {
    return implement(contracts.product.update).handler(async ({ input }) => {
      const { organizationId, id, ...data } = input;
      return this.productService.updateProduct(id, organizationId, data);
    });
  }

  @Implement(contracts.product.delete)
  delete() {
    return implement(contracts.product.delete).handler(async ({ input }) => {
      await this.productService.deleteProduct(input.organizationId, input.id);
      return { success: true };
    });
  }
}
