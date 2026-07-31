import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import type { ProductGroup } from '@repo/contracts';

const uuid = () => crypto.randomUUID();

@Injectable()
export class ProductGroupService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async listProductGroups(organizationId: string): Promise<ProductGroup[]> {
    console.log(organizationId);
    // TODO: implement when db tables are defined
    return Promise.resolve([
      {
        id: 'grp-cement',
        organizationId,
        specName: 'Cement & Gypsum',
        brandPriority: ['Royal Omani', 'Oman Cement'],
        stockTrackingMode: 'group',
        groupReorderThreshold: 50,
      },
      {
        id: 'grp-steel',
        organizationId,
        specName: 'Steel & Metal',
        brandPriority: ['Muscat Steel'],
        stockTrackingMode: 'sku',
        groupReorderThreshold: null,
      },
      {
        id: 'grp-paint',
        organizationId,
        specName: 'Paints & Finishes',
        brandPriority: ['Jotun', 'Dulux'],
        stockTrackingMode: 'sku',
        groupReorderThreshold: 20,
      },
    ]);
  }

  async createProductGroup(
    organizationId: string,
    data: {
      specName: string;
      brandPriority?: string[];
      stockTrackingMode?: 'group' | 'sku';
      groupReorderThreshold?: number;
    },
  ): Promise<ProductGroup> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      organizationId,
      specName: data.specName,
      brandPriority: data.brandPriority ?? [],
      stockTrackingMode: data.stockTrackingMode ?? 'sku',
      groupReorderThreshold: data.groupReorderThreshold ?? null,
    });
  }

  async updateProductGroup(
    id: string,
    data: Partial<{
      specName: string;
      brandPriority: string[];
      stockTrackingMode: 'group' | 'sku';
      groupReorderThreshold: number;
    }>,
  ): Promise<ProductGroup> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      organizationId: '',
      specName: data.specName ?? '',
      brandPriority: data.brandPriority ?? [],
      stockTrackingMode: data.stockTrackingMode ?? 'sku',
      groupReorderThreshold: data.groupReorderThreshold ?? null,
    });
  }

  async deleteProductGroup(id: string): Promise<void> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve();
  }
}
