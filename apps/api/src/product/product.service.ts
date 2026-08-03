import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { dz, products, productImages } from '@repo/db';
import type { Product, ProductDetail } from '@repo/contracts';
import { and, eq, isNull } from 'drizzle-orm';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

type ProductRow = typeof products.$inferSelect;

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface RoleScope {
  isManagerOrOwner: boolean;
  activeTeamId: string | null;
}

@Injectable()
export class ProductService {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient,
    private readonly configService: ConfigService,
  ) {}

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

  private async resolveRoleScope(
    organizationId: string,
    session?: {
      session?: { userId?: string; activeTeamId?: string | null } | null;
    },
  ): Promise<RoleScope> {
    const userId = session?.session?.userId;
    const activeTeamId = session?.session?.activeTeamId ?? null;

    if (!userId) {
      return { isManagerOrOwner: false, activeTeamId };
    }

    const roleRow = await this.db.query.member.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    const role = roleRow?.role;
    const isManagerOrOwner = role === 'owner' || role === 'manager';

    return { isManagerOrOwner, activeTeamId };
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

  async getProduct(
    organizationId: string,
    id: string,
    session?: {
      session?: { userId?: string; activeTeamId?: string | null } | null;
    },
  ): Promise<ProductDetail> {
    const row = await this.db.query.products.findFirst({
      where: { id, orgId: organizationId, deletedAt: { isNull: true } },
      with: {
        productGroup: true,
        category: true,
        images: {
          where: { deletedAt: { isNull: true } },
          orderBy: (t, { desc }) => [desc(t.isPrimary)],
        },
        stock: {
          with: {
            team: true,
          },
        },
        locationOverrides: {
          with: {
            team: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Product not found');
    }

    const scope = await this.resolveRoleScope(organizationId, session);

    const stockRows = row.stock ?? [];

    const stock = stockRows.map((s) => ({
      teamId: s.teamId,
      teamName: s.team?.name ?? null,
      quantity: s.quantity?.toString() ?? '0',
    }));

    let stockTotal = '0';
    for (const s of stockRows) {
      const q = s.quantity;
      if (q) stockTotal = (BigInt(stockTotal) + BigInt(q)).toString();
    }

    const overrides = row.locationOverrides
      .filter((o) => scope.isManagerOrOwner || scope.activeTeamId === o.teamId)
      .map((o) => ({
        teamId: o.teamId,
        teamName: o.team?.name ?? null,
        priceOverrideMinor: o.priceOverrideMinor?.toString() ?? null,
      }));

    return {
      ...this.toProduct(row),
      activeCostPriceMinor: asMinor(row.activeCostPriceMinor),
      costLastUpdated: row.costLastUpdated?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? null,
      productGroup: row.productGroup
        ? {
            specName: row.productGroup.specName,
            stockTrackingMode: row.productGroup.stockTrackingMode,
            groupReorderThreshold: row.productGroup.groupReorderThreshold,
          }
        : null,
      categoryName: row.category?.name ?? null,
      images: row.images.map((img) => ({
        id: img.id,
        productId: img.productId,
        organizationId: img.orgId,
        imageUrl: img.imageUrl,
        storageKey: img.storageKey,
        isPrimary: img.isPrimary,
        altText: img.altText,
        mimeType: img.mimeType,
        width: img.width,
        height: img.height,
        createdAt: img.createdAt?.toISOString() ?? null,
      })),
      stock,
      stockTotal,
      locationOverrides: overrides,
    };
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
      loyaltyPoints?: {
        mode?: 'none' | 'fixed' | 'price_percent';
        value?: number | null;
      };
      reorderThreshold?: number;
      needsNotes?: boolean;
      notes?: string;
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
        loyaltyPointsMode: data.loyaltyPoints?.mode ?? 'none',
        loyaltyPointsValue:
          data.loyaltyPoints?.mode === 'none'
            ? null
            : (data.loyaltyPoints?.value ?? null),
        reorderThreshold: data.reorderThreshold ?? null,
        needsNotes: data.needsNotes ?? false,
        notes: data.notes ?? null,
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
      loyaltyPoints: {
        mode?: 'none' | 'fixed' | 'price_percent';
        value?: number | null;
      };
      reorderThreshold: number;
      needsNotes: boolean;
      notes: string;
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
        ...(data.loyaltyPoints !== undefined && {
          loyaltyPointsMode: data.loyaltyPoints.mode ?? 'none',
          loyaltyPointsValue:
            data.loyaltyPoints.mode === 'none'
              ? null
              : (data.loyaltyPoints.value ?? null),
        }),
        ...(data.reorderThreshold !== undefined && {
          reorderThreshold: data.reorderThreshold,
        }),
        ...(data.needsNotes !== undefined && {
          needsNotes: data.needsNotes,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
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

  async uploadImage(
    organizationId: string,
    productId: string,
    file: UploadedFile,
  ): Promise<{ url: string }> {
    const product = await this.db.query.products.findFirst({
      where: {
        id: productId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const deploymentMode =
      this.configService.get<string>('DEPLOYMENT_MODE') ?? 'local';

    let url: string;
    let storageKey: string | null = null;

    if (deploymentMode === 'local') {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const uploadDir = path.resolve(
        process.cwd(),
        '..',
        'web',
        'public',
        'uploads',
        'products',
      );
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${productId}-${Date.now()}${path.extname(file.originalname)}`;
      fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
      url = `/uploads/products/${filename}`;
      storageKey = filename;
    } else {
      url = `https://s3-bucket.example.com/products/${productId}/${Date.now()}-${file.originalname}`;
    }

    const existing = await this.db.query.productImages.findFirst({
      where: {
        productId,
        orgId: organizationId,
        deletedAt: { isNull: true },
        isPrimary: true,
      },
    });

    if (existing) {
      await this.db
        .update(productImages)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(productImages.id, existing.id));
    }

    await this.db.insert(productImages).values({
      productId,
      orgId: organizationId,
      imageUrl: url,
      storageKey,
      isPrimary: true,
      mimeType: file.mimetype,
      width: null,
      height: null,
      altText: product.name,
    });

    return { url };
  }
}
