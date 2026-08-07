import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { orgCatalogVersions } from '@repo/db';
import type {
  CatalogDelta,
  CatalogStockPayload,
  CatalogVersion,
  RevalidateStockResult,
} from '@repo/contracts';
import { eq } from 'drizzle-orm';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

const toIso = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

@Injectable()
export class CatalogService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async getVersion(organizationId: string): Promise<CatalogVersion> {
    const [row] = await this.db
      .select({
        version: orgCatalogVersions.version,
        lastChangedAt: orgCatalogVersions.lastChangedAt,
      })
      .from(orgCatalogVersions)
      .where(eq(orgCatalogVersions.orgId, organizationId));

    return {
      organizationId,
      version: row?.version ?? 1,
      lastChangedAt: toIso(row?.lastChangedAt),
    };
  }

  async sync(
    organizationId: string,
    since?: string,
    teamId?: string,
  ): Promise<CatalogDelta> {
    const sinceDate = since ? new Date(since) : undefined;
    const after = sinceDate ? { gt: sinceDate } : undefined;

    const productRows = await this.db.query.products.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
    });
    const productGroupRows = await this.db.query.productGroups.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
    });
    const categoryRows = await this.db.query.categories.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
    });
    const productImageRows = await this.db.query.productImages.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
    });
    const alternativeRows = await this.db.query.productAlternatives.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
      orderBy: (t, { asc, desc }) => [asc(t.sortOrder), desc(t.isPrimary)],
    });
    const priceListRows = await this.db.query.priceLists.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
    });
    const overrideRows = await this.db.query.priceListOverrides.findMany({
      where: { orgId: organizationId, ...(after ? { updatedAt: after } : {}) },
    });
    const locationOverrideRows =
      await this.db.query.productLocationOverrides.findMany({
        where: {
          orgId: organizationId,
          ...(teamId ? { teamId } : {}),
          ...(after ? { updatedAt: after } : {}),
        },
      });
    const tagRows = await this.db.query.productTags.findMany({
      where: {
        orgId: organizationId,
        ...(teamId ? { teamId } : {}),
        ...(after ? { updatedAt: after } : {}),
      },
    });

    const scopedTagIds = (
      teamId
        ? tagRows
        : await this.db.query.productTags.findMany({
            where: { orgId: organizationId },
            columns: { id: true },
          })
    ).map((row) => row.id);

    const tagAssignmentRows =
      scopedTagIds.length > 0
        ? await this.db.query.productTagAssignments.findMany({
            where: {
              tagId: { in: scopedTagIds },
              ...(after ? { updatedAt: after } : {}),
            },
          })
        : [];

    return {
      products: productRows.map((r) => ({
        id: r.id,
        organizationId: r.orgId,
        productGroupId: r.productGroupId,
        categoryId: r.categoryId,
        name: r.name,
        skuCode: r.skuCode ?? null,
        specCode: r.specCode ?? null,
        brandTag: r.brandTag ?? null,
        basePriceMinor: asMinor(r.basePriceMinor),
        activeCostPriceMinor: asMinor(r.activeCostPriceMinor),
        unit: r.unit ?? null,
        aliases: r.aliases ?? null,
        eligibleForLoyalty: r.eligibleForLoyalty,
        reorderThreshold: r.reorderThreshold,
        needsNotes: r.needsNotes,
        notes: r.notes ?? null,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      productGroups: productGroupRows.map((r) => ({
        id: r.id,
        organizationId: r.orgId,
        specName: r.specName,
        stockTrackingMode: r.stockTrackingMode,
        groupReorderThreshold: r.groupReorderThreshold,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      categories: categoryRows.map((r) => ({
        id: r.id,
        organizationId: r.orgId,
        parentId: r.parentId,
        name: r.name,
        sortOrder: r.sortOrder,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      productImages: productImageRows.map((r) => ({
        id: r.id,
        productId: r.productId,
        organizationId: r.orgId,
        imageUrl: r.imageUrl,
        isPrimary: r.isPrimary,
        altText: r.altText ?? null,
        mimeType: r.mimeType ?? null,
        width: r.width,
        height: r.height,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      productAlternatives: alternativeRows.map((r) => ({
        id: r.id,
        organizationId: r.orgId,
        productId: r.productId,
        alternativeProductId: r.alternativeProductId,
        isPrimary: r.isPrimary,
        sortOrder: r.sortOrder,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      priceLists: priceListRows.map((r) => ({
        id: r.id,
        organizationId: r.orgId,
        name: r.name,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      priceListOverrides: overrideRows.map((r) => ({
        id: r.id,
        priceListId: r.priceListId,
        productId: r.productId,
        organizationId: r.orgId,
        priceMinor: asMinor(r.priceMinor),
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      productLocationOverrides: locationOverrideRows.map((r) => ({
        id: r.id,
        productId: r.productId,
        teamId: r.teamId,
        organizationId: r.orgId,
        priceOverrideMinor: r.priceOverrideMinor
          ? asMinor(r.priceOverrideMinor)
          : null,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      productTags: tagRows.map((r) => ({
        id: r.id,
        organizationId: r.orgId,
        teamId: r.teamId,
        name: r.name,
        colour: r.colour ?? null,
        sortOrder: r.sortOrder,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
      productTagAssignments: tagAssignmentRows.map((r) => ({
        tagId: r.tagId,
        productId: r.productId,
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: toIso(r.deletedAt),
      })),
    };
  }

  async getStock(
    organizationId: string,
    teamId: string,
  ): Promise<CatalogStockPayload> {
    const rows = await this.db.query.stock.findMany({
      where: { orgId: organizationId, teamId },
    });

    return {
      organizationId,
      teamId,
      stock: rows.map((r) => ({
        productId: r.productId,
        teamId: r.teamId,
        organizationId: r.orgId,
        quantity: r.quantity,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async revalidate(
    organizationId: string,
    teamId: string,
    productIds: string[],
  ): Promise<RevalidateStockResult[]> {
    if (productIds.length === 0) {
      return [];
    }

    const rows = await this.db.query.stock.findMany({
      where: { orgId: organizationId, teamId, productId: { in: productIds } },
    });

    const quantityByProduct = new Map(
      rows.map((r) => [r.productId, r.quantity]),
    );

    return productIds.map((productId) => ({
      productId,
      quantity: quantityByProduct.get(productId) ?? '0',
    }));
  }
}
