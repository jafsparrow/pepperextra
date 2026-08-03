import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { products } from '@repo/db';
import type { Product, ProductGroup } from '@repo/contracts';
import { and, eq, isNull } from 'drizzle-orm';

const uuid = () => crypto.randomUUID();

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

type ProductRow = typeof products.$inferSelect;

@Injectable()
export class ProductGroupService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private toProduct(row: ProductRow): Product {
    return {
      id: row.id,
      organizationId: row.orgId,
      productGroupId: row.productGroupId,
      categoryId: row.categoryId,
      name: row.name,
      skuCode: row.skuCode ?? '',
      specCode: row.specCode,
      brandTag: row.brandTag,
      basePriceMinor: asMinor(row.basePriceMinor),
      unit: row.unit,
      aliases: row.aliases ?? [],
      eligibleForLoyalty: row.eligibleForLoyalty,
      loyaltyPoints: {
        mode: (row.loyaltyPointsMode ?? 'none') as
          | 'none'
          | 'fixed'
          | 'price_percent',
        value: row.loyaltyPointsValue,
      },
      reorderThreshold: row.reorderThreshold,
      needsNotes: row.needsNotes,
      notes: row.notes,
    };
  }

  async listGroupProducts(
    organizationId: string,
    groupId: string,
  ): Promise<Product[]> {
    const rows = await this.db.query.products.findMany({
      where: {
        orgId: organizationId,
        productGroupId: groupId,
        deletedAt: { isNull: true },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    return rows.map((row) => this.toProduct(row));
  }

  async addProductToGroup(
    organizationId: string,
    groupId: string,
    productId: string,
  ): Promise<Product> {
    const [row] = await this.db
      .update(products)
      .set({ productGroupId: groupId, updatedAt: new Date() })
      .where(
        and(
          eq(products.id, productId),
          eq(products.orgId, organizationId),
          isNull(products.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Product not found');
    }

    return this.toProduct(row);
  }

  async removeProductFromGroup(
    organizationId: string,
    groupId: string,
    productId: string,
  ): Promise<Product> {
    const [row] = await this.db
      .update(products)
      .set({ productGroupId: null, updatedAt: new Date() })
      .where(
        and(
          eq(products.id, productId),
          eq(products.orgId, organizationId),
          eq(products.productGroupId, groupId),
          isNull(products.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Product not found in this group');
    }

    return this.toProduct(row);
  }

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
