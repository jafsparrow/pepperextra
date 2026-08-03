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

  @Implement(contracts.supplier.get)
  get() {
    return implement(contracts.supplier.get).handler(async ({ input }) => {
      return this.supplierService.getSupplier(input.organizationId, input.id);
    });
  }

  @Implement(contracts.supplier.listInvoices)
  listInvoices() {
    return implement(contracts.supplier.listInvoices).handler(
      async ({ input }) => {
        return this.supplierService.listSupplierInvoices(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.supplier.getInvoice)
  getInvoice() {
    return implement(contracts.supplier.getInvoice).handler(
      async ({ input }) => {
        return this.supplierService.getSupplierInvoice(
          input.organizationId,
          input.supplierId,
          input.invoiceId,
        );
      },
    );
  }

  @Implement(contracts.supplier.listPayments)
  listPayments() {
    return implement(contracts.supplier.listPayments).handler(
      async ({ input }) => {
        return this.supplierService.listSupplierPayments(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.supplier.createPayment)
  createPayment() {
    return implement(contracts.supplier.createPayment).handler(
      async ({ input }) => {
        const { organizationId, supplierId, ...data } = input;
        return this.supplierService.createSupplierPayment(
          organizationId,
          supplierId,
          data,
        );
      },
    );
  }
}
