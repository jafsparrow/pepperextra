import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import type { Product } from '@repo/contracts';

const uuid = () => crypto.randomUUID();

@Injectable()
export class ProductService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async listProducts(input: {
    organizationId: string;
    teamId?: string;
    productGroupId?: string;
    search?: string;
    brandTag?: string;
  }): Promise<Product[]> {
    console.log(input);
    // TODO: implement when db tables are defined
    let products: Product[] = [
      {
        id: 'prod-cement-50',
        organizationId: input.organizationId,
        productGroupId: 'grp-cement',
        name: 'Ordinary Portland Cement 50kg',
        skuCode: 'CEM-OPC-50',
        specCode: 'OPC 42.5N',
        brandTag: 'Royal Omani',
        basePriceMinor: '3250',
        unit: 'bag',
        aliases: ['cement', 'اسمنت'],
        eligibleForLoyalty: true,
        reorderThreshold: 100,
      },
      {
        id: 'prod-steel-12',
        organizationId: input.organizationId,
        productGroupId: 'grp-steel',
        name: 'Steel Rebar 12mm',
        skuCode: 'STL-RBR-12',
        specCode: 'HRB400',
        brandTag: 'Muscat Steel',
        basePriceMinor: '7800',
        unit: 'bar',
        aliases: ['rebar', 'حديد'],
        eligibleForLoyalty: false,
        reorderThreshold: 60,
      },
      {
        id: 'prod-paint-w',
        organizationId: input.organizationId,
        productGroupId: 'grp-paint',
        name: 'Jotun Lady Wall Primer 1L',
        skuCode: 'PNT-JTN-1L',
        specCode: null,
        brandTag: 'Jotun',
        basePriceMinor: '4500',
        unit: 'can',
        aliases: ['primer'],
        eligibleForLoyalty: true,
        reorderThreshold: 30,
      },
    ];

    if (input.productGroupId) {
      products = products.filter(
        (p) => p.productGroupId === input.productGroupId,
      );
    }
    if (input.brandTag) {
      products = products.filter((p) => p.brandTag === input.brandTag);
    }
    if (input.search) {
      const q = input.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.skuCode.toLowerCase().includes(q) ||
          p.specCode?.toLowerCase().includes(q),
      );
    }
    return Promise.resolve(products);
  }

  async createProduct(
    organizationId: string,
    data: {
      name: string;
      skuCode: string;
      productGroupId?: string;
      specCode?: string;
      brandTag?: string;
      basePriceMinor: string;
      unit?: string;
      aliases?: string[];
      eligibleForLoyalty?: boolean;
      reorderThreshold?: number;
    },
  ): Promise<Product> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      organizationId,
      productGroupId: data.productGroupId ?? null,
      name: data.name,
      skuCode: data.skuCode,
      specCode: data.specCode ?? null,
      brandTag: data.brandTag ?? null,
      basePriceMinor: data.basePriceMinor,
      unit: data.unit ?? null,
      aliases: data.aliases ?? [],
      eligibleForLoyalty: data.eligibleForLoyalty ?? false,
      reorderThreshold: data.reorderThreshold ?? null,
    });
  }

  async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      skuCode: string;
      productGroupId: string;
      specCode: string;
      brandTag: string;
      basePriceMinor: string;
      unit: string;
      aliases: string[];
      eligibleForLoyalty: boolean;
      reorderThreshold: number;
    }>,
  ): Promise<Product> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      organizationId: '',
      productGroupId: data.productGroupId ?? null,
      name: data.name ?? '',
      skuCode: data.skuCode ?? '',
      specCode: data.specCode ?? null,
      brandTag: data.brandTag ?? null,
      basePriceMinor: data.basePriceMinor ?? '0',
      unit: data.unit ?? null,
      aliases: data.aliases ?? [],
      eligibleForLoyalty: data.eligibleForLoyalty ?? false,
      reorderThreshold: data.reorderThreshold ?? null,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve();
  }
}
