import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { CategoryService } from './category.service.js';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Implement(contracts.category.list)
  list() {
    return implement(contracts.category.list).handler(async ({ input }) => {
      return this.categoryService.listCategories(input.organizationId);
    });
  }

  @Implement(contracts.category.create)
  create() {
    return implement(contracts.category.create).handler(async ({ input }) => {
      const { organizationId, ...data } = input;
      return this.categoryService.createCategory(organizationId, data);
    });
  }

  @Implement(contracts.category.update)
  update() {
    return implement(contracts.category.update).handler(async ({ input }) => {
      const { organizationId, id, ...data } = input;
      return this.categoryService.updateCategory(organizationId, id, data);
    });
  }

  @Implement(contracts.category.delete)
  delete() {
    return implement(contracts.category.delete).handler(async ({ input }) => {
      await this.categoryService.deleteCategory(input.organizationId, input.id);
      return { success: true };
    });
  }
}
