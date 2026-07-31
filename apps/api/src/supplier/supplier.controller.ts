import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { SupplierService } from './supplier.service.js';

@Controller()
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Implement(contracts.supplier.list)
  list() {
    return implement(contracts.supplier.list).handler(async ({ input }) => {
      return this.supplierService.listSuppliers(input.organizationId);
    });
  }

  @Implement(contracts.supplier.create)
  create() {
    return implement(contracts.supplier.create).handler(async ({ input }) => {
      const { organizationId, ...data } = input;
      return this.supplierService.createSupplier(organizationId, data);
    });
  }

  @Implement(contracts.supplier.update)
  update() {
    return implement(contracts.supplier.update).handler(async ({ input }) => {
      const { organizationId: _organizationId, id, ...data } = input;
      console.log(_organizationId);
      return this.supplierService.updateSupplier(id, data);
    });
  }

  @Implement(contracts.supplier.delete)
  delete() {
    return implement(contracts.supplier.delete).handler(async ({ input }) => {
      await this.supplierService.deleteSupplier(input.id);
      return { success: true };
    });
  }
}
