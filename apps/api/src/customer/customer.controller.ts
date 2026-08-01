import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import type { AuthInstance } from '@repo/auth';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
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

  @Implement(contracts.customer.get)
  get() {
    return implement(contracts.customer.get).handler(async ({ input }) => {
      return this.customerService.getCustomer(input.organizationId, input.id);
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
      const { organizationId, id, ...data } = input;
      return this.customerService.updateCustomer(id, organizationId, data);
    });
  }

  @Implement(contracts.customer.delete)
  delete() {
    return implement(contracts.customer.delete).handler(async ({ input }) => {
      await this.customerService.deleteCustomer(input.organizationId, input.id);
      return { success: true };
    });
  }

  @Implement(contracts.customer.listInvoices)
  listInvoices() {
    return implement(contracts.customer.listInvoices).handler(
      async ({ input }) => {
        return this.customerService.listCustomerInvoices(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.customer.listPayments)
  listPayments() {
    return implement(contracts.customer.listPayments).handler(
      async ({ input }) => {
        return this.customerService.listCustomerPayments(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.customer.listCreditNotes)
  listCreditNotes() {
    return implement(contracts.customer.listCreditNotes).handler(
      async ({ input }) => {
        return this.customerService.listCustomerCreditNotes(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.customer.listWarrantyClaims)
  listWarrantyClaims() {
    return implement(contracts.customer.listWarrantyClaims).handler(
      async ({ input }) => {
        return this.customerService.listCustomerWarrantyClaims(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.customer.listSites)
  listSites() {
    return implement(contracts.customer.listSites).handler(
      async ({ input }) => {
        return this.customerService.listCustomerSites(
          input.organizationId,
          input.id,
        );
      },
    );
  }

  @Implement(contracts.customer.createSite)
  createSite(@Session() session: UserSession<AuthInstance>) {
    return implement(contracts.customer.createSite).handler(
      async ({ input }) => {
        const { organizationId, customerId, ...data } = input;
        const userId = session.session?.userId;
        if (!userId) {
          throw new Error('No authenticated user');
        }
        return this.customerService.createCustomerSite(
          organizationId,
          customerId,
          data,
          userId,
        );
      },
    );
  }

  @Implement(contracts.customer.updateSite)
  updateSite() {
    return implement(contracts.customer.updateSite).handler(
      async ({ input }) => {
        const { organizationId, customerId, siteId, ...data } = input;
        return this.customerService.updateCustomerSite(
          organizationId,
          customerId,
          siteId,
          data,
        );
      },
    );
  }

  @Implement(contracts.customer.deleteSite)
  deleteSite() {
    return implement(contracts.customer.deleteSite).handler(
      async ({ input }) => {
        await this.customerService.deleteCustomerSite(
          input.organizationId,
          input.customerId,
          input.siteId,
        );
        return { success: true };
      },
    );
  }
}
