import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { CustomerService } from './customer.service.js';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Implement(contracts.customer.list)
  list() {
    return implement(contracts.customer.list).handler(async ({ input }) => {
      return this.customerService.listCustomers(input);
    });
  }

  @Implement(contracts.customer.create)
  create() {
    return implement(contracts.customer.create).handler(async ({ input }) => {
      const { organizationId, ...data } = input;
      return this.customerService.createCustomer(organizationId, data);
    });
  }

  @Implement(contracts.customer.update)
  update() {
    return implement(contracts.customer.update).handler(async ({ input }) => {
      const { organizationId: _organizationId, id, ...data } = input;
      console.log(_organizationId);
      return this.customerService.updateCustomer(id, data);
    });
  }

  @Implement(contracts.customer.delete)
  delete() {
    return implement(contracts.customer.delete).handler(async ({ input }) => {
      await this.customerService.deleteCustomer(input.id);
      return { success: true };
    });
  }
}
