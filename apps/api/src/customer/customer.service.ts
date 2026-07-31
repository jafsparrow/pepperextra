import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import type { Customer } from '@repo/contracts';

const uuid = () => crypto.randomUUID();

@Injectable()
export class CustomerService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async listCustomers(input: {
    organizationId: string;
    type?: 'retail' | 'account' | 'contractor';
    search?: string;
  }): Promise<Customer[]> {
    console.log(input);
    // TODO: implement when db tables are defined
    let customers: Customer[] = [
      {
        id: 'cust-001',
        organizationId: input.organizationId,
        type: 'retail',
        name: 'Walk-in Customer',
        phone: null,
        email: null,
        creditLimitMinor: null,
        paymentTermsDays: null,
        vatNumber: null,
        billingAddress: null,
        notes: null,
      },
      {
        id: 'cust-002',
        organizationId: input.organizationId,
        type: 'account',
        name: 'Al Rawabi Contracting LLC',
        phone: '+968 9901 2233',
        email: 'accounts@rawabicontracting.om',
        creditLimitMinor: '250000',
        paymentTermsDays: 30,
        vatNumber: 'OM123456789',
        billingAddress: 'PO Box 123, Muscat, Oman',
        notes: 'Net 30, delivery to site',
      },
      {
        id: 'cust-003',
        organizationId: input.organizationId,
        type: 'contractor',
        name: 'Badr Al Zubair',
        phone: '+968 9700 4455',
        email: 'badr.z@example.om',
        creditLimitMinor: '75000',
        paymentTermsDays: 15,
        vatNumber: null,
        billingAddress: 'Seeb, Muscat',
        notes: null,
      },
      {
        id: 'cust-004',
        organizationId: input.organizationId,
        type: 'account',
        name: 'Oman Builders Co.',
        phone: '+968 2460 1122',
        email: 'procurement@omanbuilders.om',
        creditLimitMinor: '500000',
        paymentTermsDays: 45,
        vatNumber: 'OM987654321',
        billingAddress: 'Ghala Industrial Estate, Muscat',
        notes: 'Quarterly frame agreement',
      },
    ];

    if (input.type) {
      customers = customers.filter((c) => c.type === input.type);
    }
    if (input.search) {
      const q = input.search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }
    return Promise.resolve(customers);
  }

  async createCustomer(
    organizationId: string,
    data: {
      type: 'retail' | 'account' | 'contractor';
      name: string;
      phone?: string;
      email?: string;
      creditLimitMinor?: string;
      paymentTermsDays?: number;
      vatNumber?: string;
      billingAddress?: string;
      notes?: string;
    },
  ): Promise<Customer> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      organizationId,
      type: data.type,
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      creditLimitMinor: data.creditLimitMinor ?? null,
      paymentTermsDays: data.paymentTermsDays ?? null,
      vatNumber: data.vatNumber ?? null,
      billingAddress: data.billingAddress ?? null,
      notes: data.notes ?? null,
    });
  }

  async updateCustomer(
    id: string,
    data: Partial<{
      type: 'retail' | 'account' | 'contractor';
      name: string;
      phone: string;
      email: string;
      creditLimitMinor: string;
      paymentTermsDays: number;
      vatNumber: string;
      billingAddress: string;
      notes: string;
    }>,
  ): Promise<Customer> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      organizationId: '',
      type: data.type ?? 'retail',
      name: data.name ?? '',
      phone: data.phone ?? null,
      email: data.email ?? null,
      creditLimitMinor: data.creditLimitMinor ?? null,
      paymentTermsDays: data.paymentTermsDays ?? null,
      vatNumber: data.vatNumber ?? null,
      billingAddress: data.billingAddress ?? null,
      notes: data.notes ?? null,
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve();
  }
}
