import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import type { Supplier } from '@repo/contracts';

const uuid = () => crypto.randomUUID();

@Injectable()
export class SupplierService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async listSuppliers(organizationId: string): Promise<Supplier[]> {
    console.log(organizationId);
    // TODO: implement when db tables are defined
    return Promise.resolve([
      {
        id: 'sup-omancem',
        organizationId,
        name: 'Oman Cement Company',
        contactName: 'Salim Al Harthy',
        contactPhone: '+968 9244 1122',
        contactEmail: 'sales@oman-cement.om',
        paymentTermsDays: 30,
      },
      {
        id: 'sup-muscat-steel',
        organizationId,
        name: 'Muscat Steel Trading',
        contactName: 'Rajesh Kumar',
        contactPhone: '+968 9133 4455',
        contactEmail: 'info@muscatsteel.om',
        paymentTermsDays: 15,
      },
      {
        id: 'sup-jotun',
        organizationId,
        name: 'Jotun Oman',
        contactName: 'Aisha Al Balushi',
        contactPhone: '+968 2456 7788',
        contactEmail: 'orders.oman@jotun.com',
        paymentTermsDays: 45,
      },
    ]);
  }

  async createSupplier(
    organizationId: string,
    data: {
      name: string;
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
      paymentTermsDays?: number;
    },
  ): Promise<Supplier> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      organizationId,
      name: data.name,
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      contactEmail: data.contactEmail ?? null,
      paymentTermsDays: data.paymentTermsDays ?? null,
    });
  }

  async updateSupplier(
    id: string,
    data: Partial<{
      name: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      paymentTermsDays: number;
    }>,
  ): Promise<Supplier> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      organizationId: '',
      name: data.name ?? '',
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      contactEmail: data.contactEmail ?? null,
      paymentTermsDays: data.paymentTermsDays ?? null,
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve();
  }
}
