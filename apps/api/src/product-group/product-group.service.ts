import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { productGroups, products, stock } from '@repo/db';
import type {
  Product,
  ProductGroup,
  ProductGroupDetail,
} from '@repo/contracts';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

type ProductRow = typeof products.$inferSelect;
type ProductGroupRow = typeof productGroups.$inferSelect;

@Injectable()
export class ProductGroupService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private toProductGroup(
    row: ProductGroupRow,
    productCount = 0,
    groupStockTotal = '0',
  ): ProductGroup {
    return {
      id: row.id,
      organizationId: row.orgId,
      specName: row.specName,
      brandPriority: row.brandPriority ?? [],
      stockTrackingMode: row.stockTrackingMode,
      groupReorderThreshold: row.groupReorderThreshold,
      productCount,
      groupStockTotal,
    };
  }

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
    const rows = await this.db.query.productGroups.findMany({
      where: { orgId: organizationId, deletedAt: { isNull: true } },
      orderBy: (t, { asc }) => [asc(t.specName)],
    });

    const groupIds = rows.map((row) => row.id);
    const countByGroup = new Map<string, number>();
    const stockByGroup = new Map<string, bigint>();

    if (groupIds.length > 0) {
      const counts = await this.db
        .select({
          groupId: products.productGroupId,
          count: sql<number>`count(*)::int`,
        })
        .from(products)
        .where(
          and(
            inArray(products.productGroupId, groupIds),
            isNull(products.deletedAt),
          ),
        )
        .groupBy(products.productGroupId);

      for (const c of counts) {
        if (c.groupId) countByGroup.set(c.groupId, c.count);
      }

      const stockRows = await this.db
        .select({
          groupId: products.productGroupId,
          quantity: stock.quantity,
        })
        .from(stock)
        .innerJoin(products, eq(stock.productId, products.id))
        .where(
          and(
            inArray(products.productGroupId, groupIds),
            isNull(products.deletedAt),
          ),
        );

      for (const r of stockRows) {
        if (!r.groupId) continue;
        const q = r.quantity ? BigInt(r.quantity) : 0n;
        stockByGroup.set(r.groupId, (stockByGroup.get(r.groupId) ?? 0n) + q);
      }
    }

    return rows.map((row) =>
      this.toProductGroup(
        row,
        countByGroup.get(row.id) ?? 0,
        (stockByGroup.get(row.id) ?? 0n).toString(),
      ),
    );
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
    try {
      const [row] = await this.db
        .insert(productGroups)
        .values({
          orgId: organizationId,
          specName: data.specName,
          brandPriority: data.brandPriority ?? [],
          stockTrackingMode: data.stockTrackingMode ?? 'sku',
          groupReorderThreshold: data.groupReorderThreshold ?? null,
        })
        .returning();

      return this.toProductGroup(row, 0, '0');
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'A product group with this name already exists',
        );
      }
      throw error;
    }
  }

  async updateProductGroup(
    organizationId: string,
    id: string,
    data: Partial<{
      specName: string;
      brandPriority: string[];
      stockTrackingMode: 'group' | 'sku';
      groupReorderThreshold: number;
    }>,
  ): Promise<ProductGroup> {
    const [row] = await this.db
      .update(productGroups)
      .set({
        ...(data.specName !== undefined && { specName: data.specName }),
        ...(data.brandPriority !== undefined && {
          brandPriority: data.brandPriority,
        }),
        ...(data.stockTrackingMode !== undefined && {
          stockTrackingMode: data.stockTrackingMode,
        }),
        ...(data.groupReorderThreshold !== undefined && {
          groupReorderThreshold: data.groupReorderThreshold,
        }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productGroups.id, id),
          eq(productGroups.orgId, organizationId),
          isNull(productGroups.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Product group not found');
    }

    const productCount = await this.countGroupProducts(organizationId, id);
    const groupStockTotal = await this.sumGroupStock(organizationId, id);
    return this.toProductGroup(row, productCount, groupStockTotal);
  }

  async getProductGroupDetail(
    organizationId: string,
    groupId: string,
  ): Promise<ProductGroupDetail> {
    const group = await this.db.query.productGroups.findFirst({
      where: {
        id: groupId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
    });

    if (!group) {
      throw new NotFoundException('Product group not found');
    }

    const rows = await this.db.query.products.findMany({
      where: {
        orgId: organizationId,
        productGroupId: groupId,
        deletedAt: { isNull: true },
      },
      with: { stock: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    let groupStockTotal = 0n;
    const products = rows.map((row) => {
      let stockTotal = 0n;
      for (const s of row.stock ?? []) {
        if (s.quantity) stockTotal += BigInt(s.quantity);
      }
      groupStockTotal += stockTotal;
      return { ...this.toProduct(row), stockTotal: stockTotal.toString() };
    });

    return {
      ...this.toProductGroup(
        group,
        products.length,
        groupStockTotal.toString(),
      ),
      products,
    };
  }

  async deleteProductGroup(organizationId: string, id: string): Promise<void> {
    const existing = await this.db.query.productGroups.findFirst({
      where: { id, orgId: organizationId, deletedAt: { isNull: true } },
      columns: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Product group not found');
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({ productGroupId: null, updatedAt: new Date() })
        .where(
          and(
            eq(products.productGroupId, id),
            eq(products.orgId, organizationId),
          ),
        );

      await tx
        .update(productGroups)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(productGroups.id, id));
    });
  }

  private async countGroupProducts(
    organizationId: string,
    groupId: string,
  ): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.productGroupId, groupId),
          eq(products.orgId, organizationId),
          isNull(products.deletedAt),
        ),
      );

    return row?.count ?? 0;
  }

  private async sumGroupStock(
    organizationId: string,
    groupId: string,
  ): Promise<string> {
    const rows = await this.db
      .select({ quantity: stock.quantity })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(
        and(
          eq(products.productGroupId, groupId),
          eq(products.orgId, organizationId),
          isNull(products.deletedAt),
        ),
      );

    let total = 0n;
    for (const r of rows) {
      if (r.quantity) total += BigInt(r.quantity);
    }
    return total.toString();
  }
}
