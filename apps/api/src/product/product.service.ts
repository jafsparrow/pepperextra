import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { dz, products, productImages, productAlternatives } from '@repo/db';
import { orgMetadata, currencies } from '@repo/db';
import type {
  Product,
  ProductDetail,
  ProductUploadReport,
  ProductAlternative,
} from '@repo/contracts';
import { and, eq, isNull, sql } from 'drizzle-orm';

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

  private async ensureProductExists(
    organizationId: string,
    productId: string,
  ): Promise<void> {
    const row = await this.db.query.products.findFirst({
      where: {
        id: productId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
      columns: { id: true },
    });

    if (!row) {
      throw new NotFoundException('Product not found');
    }
  }

  private toAlternative(
    row: (typeof productAlternatives.$inferSelect) & {
      alternativeProduct?: ProductRow | null;
    },
  ): ProductAlternative {
    return {
      id: row.id,
      productId: row.productId,
      alternativeProductId: row.alternativeProductId,
      isPrimary: row.isPrimary,
      alternative: {
        id: row.alternativeProduct?.id ?? row.alternativeProductId,
        name: row.alternativeProduct?.name ?? 'Unknown product',
        skuCode: row.alternativeProduct?.skuCode ?? '',
        brandTag: row.alternativeProduct?.brandTag ?? null,
        basePriceMinor: asMinor(row.alternativeProduct?.basePriceMinor),
      },
    };
  }

  async listAlternatives(
    organizationId: string,
    productId: string,
  ): Promise<ProductAlternative[]> {
    const rows = await this.db.query.productAlternatives.findMany({
      where: {
        orgId: organizationId,
        productId,
      },
      with: { alternativeProduct: true },
      orderBy: (t, { desc, asc }) => [desc(t.isPrimary), asc(t.createdAt)],
    });

    return rows.map((row) => this.toAlternative(row));
  }

  async addAlternative(
    organizationId: string,
    productId: string,
    alternativeProductId: string,
  ): Promise<ProductAlternative> {
    if (productId === alternativeProductId) {
      throw new BadRequestException(
        'A product cannot be an alternative to itself',
      );
    }

    await this.ensureProductExists(organizationId, productId);
    await this.ensureProductExists(organizationId, alternativeProductId);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(productAlternatives)
      .where(
        and(
          eq(productAlternatives.orgId, organizationId),
          eq(productAlternatives.productId, productId),
        ),
      );

    try {
      const [row] = await this.db
        .insert(productAlternatives)
        .values({
          orgId: organizationId,
          productId,
          alternativeProductId,
          isPrimary: (countRow?.count ?? 0) === 0,
        })
        .returning();

      const alternativeProduct = await this.db.query.products.findFirst({
        where: {
          id: alternativeProductId,
          orgId: organizationId,
          deletedAt: { isNull: true },
        },
      });

      return this.toAlternative({ ...row, alternativeProduct });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'This product is already an alternative',
        );
      }
      throw error;
    }
  }

  async setPrimaryAlternative(
    organizationId: string,
    productId: string,
    alternativeProductId: string,
  ): Promise<ProductAlternative> {
    return this.db.transaction(async (tx) => {
      const target = await tx.query.productAlternatives.findFirst({
        where: {
          orgId: organizationId,
          productId,
          alternativeProductId,
        },
        with: { alternativeProduct: true },
      });

      if (!target) {
        throw new NotFoundException('Alternative product not found');
      }

      await tx
        .update(productAlternatives)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(productAlternatives.orgId, organizationId),
            eq(productAlternatives.productId, productId),
            eq(productAlternatives.isPrimary, true),
          ),
        );

      await tx
        .update(productAlternatives)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(productAlternatives.id, target.id));

      return this.toAlternative({ ...target, isPrimary: true });
    });
  }

  async removeAlternative(
    organizationId: string,
    productId: string,
    alternativeProductId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [row] = await tx
        .delete(productAlternatives)
        .where(
          and(
            eq(productAlternatives.orgId, organizationId),
            eq(productAlternatives.productId, productId),
            eq(productAlternatives.alternativeProductId, alternativeProductId),
          ),
        )
        .returning({
          id: productAlternatives.id,
          isPrimary: productAlternatives.isPrimary,
        });

      if (!row) {
        throw new NotFoundException('Alternative product not found');
      }

      if (row.isPrimary) {
        const next = await tx.query.productAlternatives.findFirst({
          where: {
            orgId: organizationId,
            productId,
          },
          columns: { id: true },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        });

        if (next) {
          await tx
            .update(productAlternatives)
            .set({ isPrimary: true, updatedAt: new Date() })
            .where(eq(productAlternatives.id, next.id));
        }
      }
    });
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

  async uploadProducts(
    organizationId: string,
    file: UploadedFile,
  ): Promise<ProductUploadReport> {
    if (!file) {
      throw new BadRequestException('A CSV file is required');
    }
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Please upload a CSV file');
    }

    const rows = parseCsv(file.buffer.toString('utf8'));
    if (rows.length === 0) {
      throw new BadRequestException('The CSV file is empty');
    }

    const columnIndex = new Map<string, number>();
    rows[0].forEach((header, index) => {
      const canonical = HEADER_ALIASES[normalizeHeader(header)];
      if (canonical && !columnIndex.has(canonical)) {
        columnIndex.set(canonical, index);
      }
    });

    if (!columnIndex.has('name') || !columnIndex.has('skuCode')) {
      throw new BadRequestException(
        'The CSV must include "name" and "sku_code" columns',
      );
    }

    const [categoryByName, groupByName, minorUnitPerMajor] = await Promise.all([
      this.db.query.categories
        .findMany({
          where: { orgId: organizationId, deletedAt: { isNull: true } },
          columns: { id: true, name: true },
        })
        .then((cats) => new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))),
      this.db.query.productGroups
        .findMany({
          where: { orgId: organizationId, deletedAt: { isNull: true } },
          columns: { id: true, specName: true },
        })
        .then(
          (groups) =>
            new Map(groups.map((g) => [g.specName.toLowerCase(), g.id])),
        ),
      this.getMinorUnitPerMajor(organizationId),
    ]);

    const cell = (row: string[], key: string): string =>
      (row[columnIndex.get(key)!] ?? '').trim();

    const errors: { row: number; message: string }[] = [];
    const toInsert: (typeof products.$inferInsert)[] = [];
    const seenSkus = new Set<string>();

    for (let i = 1; i < rows.length; i++) {
      const line = rows[i];
      const rowErrors: string[] = [];

      const name = cell(line, 'name');
      const skuCode = cell(line, 'skuCode');
      if (!name) rowErrors.push('name is required');
      if (!skuCode) {
        rowErrors.push('sku_code is required');
      } else {
        const normalizedSku = skuCode.toLowerCase();
        if (seenSkus.has(normalizedSku)) {
          rowErrors.push(`duplicate sku_code "${skuCode}" in file`);
        }
        seenSkus.add(normalizedSku);
      }

      const basePrice = cell(line, 'basePrice');
      let basePriceMinor: bigint | null = null;
      if (basePrice) {
        const parsed = Number(basePrice);
        if (Number.isNaN(parsed) || parsed < 0) {
          rowErrors.push(
            `base_price "${basePrice}" is not a valid non-negative number`,
          );
        } else {
          basePriceMinor = BigInt(Math.round(parsed * minorUnitPerMajor));
        }
      }

      const reorderThresholdRaw = cell(line, 'reorderThreshold');
      let reorderThreshold: number | null = null;
      if (reorderThresholdRaw) {
        const parsed = Number(reorderThresholdRaw);
        if (!Number.isInteger(parsed) || parsed < 0) {
          rowErrors.push(
            `reorder_threshold "${reorderThresholdRaw}" must be a non-negative integer`,
          );
        } else {
          reorderThreshold = parsed;
        }
      }

      const groupName = cell(line, 'group');
      let groupId: string | null = null;
      if (groupName) {
        groupId = groupByName.get(groupName.toLowerCase()) ?? null;
        if (!groupId) {
          rowErrors.push(`group "${groupName}" not found`);
        }
      }

      const categoryName = cell(line, 'category');
      let categoryId: string | null = null;
      if (categoryName) {
        categoryId = categoryByName.get(categoryName.toLowerCase()) ?? null;
        if (!categoryId) {
          rowErrors.push(`category "${categoryName}" not found`);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, message: rowErrors.join('; ') });
        continue;
      }

      const aliasesRaw = cell(line, 'aliases');
      toInsert.push({
        orgId: organizationId,
        name,
        skuCode,
        specCode: cell(line, 'specCode') || null,
        brandTag: cell(line, 'brandTag') || null,
        basePriceMinor: basePriceMinor ?? 0n,
        unit: cell(line, 'unit') || null,
        aliases: aliasesRaw
          ? aliasesRaw
              .split('|')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        reorderThreshold,
        productGroupId: groupId,
        categoryId,
      });
    }

    let inserted = 0;
    if (toInsert.length > 0) {
      const result = await this.db
        .insert(products)
        .values(toInsert)
        .returning();
      inserted = result.length;
    }

    return {
      total: rows.length - 1,
      inserted,
      failed: errors.length,
      errors,
    };
  }

  private async getMinorUnitPerMajor(organizationId: string): Promise<number> {
    const [row] = await this.db
      .select({ minorUnitPerMajor: currencies.minorUnitPerMajor })
      .from(orgMetadata)
      .innerJoin(currencies, eq(orgMetadata.currencyId, currencies.id))
      .where(eq(orgMetadata.orgId, organizationId))
      .limit(1);

    return row?.minorUnitPerMajor ?? 100;
  }
}

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  productname: 'name',
  sku: 'skuCode',
  skucode: 'skuCode',
  sku_code: 'skuCode',
  spec: 'specCode',
  speccode: 'specCode',
  spec_code: 'specCode',
  brand: 'brandTag',
  brandtag: 'brandTag',
  brand_tag: 'brandTag',
  baseprice: 'basePrice',
  base_price: 'basePrice',
  price: 'basePrice',
  unit: 'unit',
  aliases: 'aliases',
  reorderthreshold: 'reorderThreshold',
  reorder_threshold: 'reorderThreshold',
  group: 'group',
  productgroup: 'group',
  product_group: 'group',
  category: 'category',
};

const normalizeHeader = (header: string): string =>
  header
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '');

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }

    if (ch === '\n' || ch === '\r') {
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      if (ch === '\r' && input[i + 1] === '\n') {
        i += 1;
      }
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  row.push(field);
  if (row.some((c) => c.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}
