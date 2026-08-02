import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { dz } from '@repo/db';
import { products } from '@repo/db';
import type { Product } from '@repo/contracts';
import { and, eq, isNull } from 'drizzle-orm';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

type ProductRow = typeof products.$inferSelect;

@Injectable()
export class ProductService {
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
      reorderThreshold: row.reorderThreshold,
    };
  }

  async listProducts(input: {
    organizationId: string;
    teamId?: string;
    productGroupId?: string;
    search?: string;
    brandTag?: string;
  }): Promise<Product[]> {
    const rows = await this.db.query.products.findMany({
      where: {
        orgId: input.organizationId,
        deletedAt: { isNull: true },
        ...(input.productGroupId
          ? { productGroupId: input.productGroupId }
          : {}),
        ...(input.brandTag ? { brandTag: input.brandTag } : {}),
        ...(input.search
          ? {
              OR: [
                { name: { ilike: `%${input.search}%` } },
                { skuCode: { ilike: `%${input.search}%` } },
                { specCode: { ilike: `%${input.search}%` } },
                { brandTag: { ilike: `%${input.search}%` } },
              ],
            }
          : {}),
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return rows.map((row) => this.toProduct(row));
  }

  async createProduct(
    organizationId: string,
    data: {
      name: string;
      skuCode: string;
      productGroupId?: string;
      categoryId?: string;
      specCode?: string;
      brandTag?: string;
      basePriceMinor: string;
      unit?: string;
      aliases?: string[];
      eligibleForLoyalty?: boolean;
      reorderThreshold?: number;
    },
  ): Promise<Product> {
    const [row] = await this.db
      .insert(products)
      .values({
        orgId: organizationId,
        productGroupId: data.productGroupId ?? null,
        categoryId: data.categoryId ?? null,
        name: data.name,
        skuCode: data.skuCode,
        specCode: data.specCode ?? null,
        brandTag: data.brandTag ?? null,
        basePriceMinor: data.basePriceMinor ? BigInt(data.basePriceMinor) : 0n,
        unit: data.unit ?? null,
        aliases: data.aliases ?? [],
        eligibleForLoyalty: data.eligibleForLoyalty ?? false,
        reorderThreshold: data.reorderThreshold ?? null,
      })
      .returning();

    return this.toProduct(row);
  }

  async updateProduct(
    id: string,
    organizationId: string,
    data: Partial<{
      name: string;
      skuCode: string;
      productGroupId: string;
      categoryId: string;
      specCode: string;
      brandTag: string;
      basePriceMinor: string;
      unit: string;
      aliases: string[];
      eligibleForLoyalty: boolean;
      reorderThreshold: number;
    }>,
  ): Promise<Product> {
    const [row] = await this.db
      .update(products)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.skuCode !== undefined && { skuCode: data.skuCode }),
        ...(data.productGroupId !== undefined && {
          productGroupId: data.productGroupId,
        }),
        ...(data.categoryId !== undefined && {
          categoryId: data.categoryId,
        }),
        ...(data.specCode !== undefined && { specCode: data.specCode }),
        ...(data.brandTag !== undefined && { brandTag: data.brandTag }),
        ...(data.basePriceMinor !== undefined && {
          basePriceMinor: data.basePriceMinor
            ? BigInt(data.basePriceMinor)
            : 0n,
        }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.aliases !== undefined && { aliases: data.aliases }),
        ...(data.eligibleForLoyalty !== undefined && {
          eligibleForLoyalty: data.eligibleForLoyalty,
        }),
        ...(data.reorderThreshold !== undefined && {
          reorderThreshold: data.reorderThreshold,
        }),
        updatedAt: new Date(),
      })
      .where(
        dz.and(
          dz.eq(products.id, id),
          dz.eq(products.orgId, organizationId),
          dz.isNull(products.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Product not found');
    }

    return this.toProduct(row);
  }

  async deleteProduct(organizationId: string, id: string): Promise<void> {
    await this.db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(products.id, id),
          eq(products.orgId, organizationId),
          isNull(products.deletedAt),
        ),
      );
  }
}
