import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { priceListOverrides, priceLists, products } from '@repo/db';
import type {
  PriceList,
  PriceListDetail,
  PriceListOverride,
  PriceResolvedProduct,
} from '@repo/contracts';
import { and, eq, isNull } from 'drizzle-orm';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

type PriceListRow = typeof priceLists.$inferSelect;

type OverrideRow = typeof priceListOverrides.$inferSelect & {
  product?: typeof products.$inferSelect | null;
};

@Injectable()
export class PriceListService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private toPriceList(row: PriceListRow): PriceList {
    return {
      id: row.id,
      organizationId: row.orgId,
      name: row.name,
    };
  }

  private toOverride(row: OverrideRow): PriceListOverride {
    return {
      id: row.id,
      priceListId: row.priceListId,
      productId: row.productId,
      productName: row.product?.name ?? null,
      skuCode: row.product?.skuCode ?? null,
      basePriceMinor: asMinor(row.product?.basePriceMinor),
      priceMinor: asMinor(row.priceMinor),
    };
  }

  async listPriceLists(organizationId: string): Promise<PriceList[]> {
    const rows = await this.db.query.priceLists.findMany({
      where: {
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    return rows.map((row) => this.toPriceList(row));
  }

  async getPriceList(
    organizationId: string,
    id: string,
  ): Promise<PriceListDetail> {
    const row = await this.db.query.priceLists.findFirst({
      where: { id, orgId: organizationId, deletedAt: { isNull: true } },
      with: {
        overrides: {
          where: {
            deletedAt: { isNull: true },
          },
          with: {
            product: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Price list not found');
    }

    const overrides = (row.overrides ?? [])
      .map((o) => this.toOverride(o))
      .sort((a, b) => (a.productName ?? '').localeCompare(b.productName ?? ''));

    return {
      ...this.toPriceList(row),
      overrideCount: overrides.length,
      overrides,
    };
  }

  async createPriceList(
    organizationId: string,
    data: { name: string },
  ): Promise<PriceList> {
    const [row] = await this.db
      .insert(priceLists)
      .values({ orgId: organizationId, name: data.name.trim() })
      .onConflictDoNothing({ target: [priceLists.orgId, priceLists.name] })
      .returning();

    if (!row) {
      throw new BadRequestException(
        'A price list with this name already exists',
      );
    }

    return this.toPriceList(row);
  }

  async updatePriceList(
    organizationId: string,
    id: string,
    data: Partial<{ name: string }>,
  ): Promise<PriceList> {
    if (data.name === undefined) {
      return this.getPriceList(organizationId, id);
    }

    const [row] = await this.db
      .update(priceLists)
      .set({ name: data.name.trim(), updatedAt: new Date() })
      .where(
        and(
          eq(priceLists.id, id),
          eq(priceLists.orgId, organizationId),
          isNull(priceLists.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Price list not found');
    }

    return this.toPriceList(row);
  }

  async deletePriceList(organizationId: string, id: string): Promise<void> {
    const [row] = await this.db
      .update(priceLists)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(priceLists.id, id),
          eq(priceLists.orgId, organizationId),
          isNull(priceLists.deletedAt),
        ),
      )
      .returning({ id: priceLists.id });

    if (!row) {
      throw new NotFoundException('Price list not found');
    }
  }

  private async ensurePriceList(
    organizationId: string,
    priceListId: string,
  ): Promise<void> {
    const exists = await this.db.query.priceLists.findFirst({
      where: {
        id: priceListId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
    });

    if (!exists) {
      throw new NotFoundException('Price list not found');
    }
  }

  async addOverride(
    organizationId: string,
    priceListId: string,
    data: { productId: string; priceMinor: string },
  ): Promise<PriceListOverride> {
    await this.ensurePriceList(organizationId, priceListId);

    const product = await this.db.query.products.findFirst({
      where: {
        id: data.productId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [row] = await this.db
      .insert(priceListOverrides)
      .values({
        priceListId,
        productId: data.productId,
        orgId: organizationId,
        priceMinor: BigInt(data.priceMinor),
      })
      .onConflictDoUpdate({
        target: [priceListOverrides.priceListId, priceListOverrides.productId],
        set: {
          priceMinor: BigInt(data.priceMinor),
          deletedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.toOverride({ ...row, product });
  }

  async updateOverride(
    organizationId: string,
    priceListId: string,
    productId: string,
    data: Partial<{ priceMinor: string }>,
  ): Promise<PriceListOverride> {
    if (data.priceMinor === undefined) {
      throw new BadRequestException('Nothing to update');
    }

    const [row] = await this.db
      .update(priceListOverrides)
      .set({ priceMinor: BigInt(data.priceMinor), updatedAt: new Date() })
      .where(
        and(
          eq(priceListOverrides.priceListId, priceListId),
          eq(priceListOverrides.productId, productId),
          eq(priceListOverrides.orgId, organizationId),
          isNull(priceListOverrides.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Price list override not found');
    }

    const product = await this.db.query.products.findFirst({
      where: { id: productId },
    });

    return this.toOverride({ ...row, product });
  }

  async removeOverride(
    organizationId: string,
    priceListId: string,
    productId: string,
  ): Promise<void> {
    const [row] = await this.db
      .update(priceListOverrides)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(priceListOverrides.priceListId, priceListId),
          eq(priceListOverrides.productId, productId),
          eq(priceListOverrides.orgId, organizationId),
          isNull(priceListOverrides.deletedAt),
        ),
      )
      .returning({ id: priceListOverrides.id });

    if (!row) {
      throw new NotFoundException('Price list override not found');
    }
  }

  private async resolveEffectivePriceListId(
    organizationId: string,
    input: {
      customerId?: string;
      priceListId?: string;
    },
  ): Promise<string | null> {
    if (input.priceListId) {
      const list = await this.db.query.priceLists.findFirst({
        where: {
          id: input.priceListId,
          orgId: organizationId,
          deletedAt: { isNull: true },
        },
      });

      if (!list) {
        throw new NotFoundException('Price list not found');
      }

      return list.id;
    }

    if (input.customerId) {
      const customer = await this.db.query.customers.findFirst({
        where: {
          id: input.customerId,
          orgId: organizationId,
          deletedAt: { isNull: true },
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (customer.defaultPriceListId) {
        const list = await this.db.query.priceLists.findFirst({
          where: {
            id: customer.defaultPriceListId,
            orgId: organizationId,
            deletedAt: { isNull: true },
          },
        });

        return list?.id ?? null;
      }
    }

    return null;
  }

  async resolveProductPrice(
    organizationId: string,
    input: {
      productId: string;
      customerId?: string;
      priceListId?: string;
    },
  ): Promise<PriceResolvedProduct> {
    const results = await this.resolveProductPrices(organizationId, {
      productIds: [input.productId],
      customerId: input.customerId,
      priceListId: input.priceListId,
    });

    return results[0];
  }

  async resolveProductPrices(
    organizationId: string,
    input: {
      productIds: string[];
      customerId?: string;
      priceListId?: string;
    },
  ): Promise<PriceResolvedProduct[]> {
    if (input.productIds.length === 0) {
      return [];
    }

    const priceListId = await this.resolveEffectivePriceListId(
      organizationId,
      input,
    );

    let overrideMap = new Map<string, bigint>();
    if (priceListId) {
      const overrides = await this.db.query.priceListOverrides.findMany({
        where: {
          priceListId,
          orgId: organizationId,
          productId: { in: input.productIds },
          deletedAt: { isNull: true },
        },
      });

      overrideMap = new Map(overrides.map((o) => [o.productId, o.priceMinor]));
    }

    const productRows = await this.db.query.products.findMany({
      where: {
        orgId: organizationId,
        id: { in: input.productIds },
        deletedAt: { isNull: true },
      },
    });

    const productMap = new Map(productRows.map((p) => [p.id, p]));

    return input.productIds.map((productId) => {
      const product = productMap.get(productId);
      const basePriceMinor = product?.basePriceMinor ?? 0n;
      const override = overrideMap.get(productId);

      return {
        productId,
        basePriceMinor: asMinor(basePriceMinor),
        priceMinor: asMinor(override ?? basePriceMinor),
        priceListId: override !== undefined ? priceListId : null,
        source: override !== undefined ? 'price_list' : 'base',
      } satisfies PriceResolvedProduct;
    });
  }
}
