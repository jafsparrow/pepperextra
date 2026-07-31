import { Inject, Injectable } from '@nestjs/common';
import { orgMetadata, organization } from '@repo/db';
import type { DatabaseClient } from '@repo/db';
import type { OrganizationSettings } from '@repo/contracts';
import { eq } from 'drizzle-orm';
import { DRIZZLE_TOKEN } from '../db/database.module.js';

@Injectable()
export class OrganizationSettingsService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private async resolveCountry(name: string): Promise<{
    id: string;
    currencyId: string;
  }> {
    const country = await this.db.query.countries.findFirst({
      where: { name },
    });
    if (!country) {
      throw new Error(`Country "${name}" is not supported`);
    }
    return { id: country.id, currencyId: country.currencyId };
  }

  private async resolveCurrencyId(code: string): Promise<string> {
    const currency = await this.db.query.currencies.findFirst({
      where: { code },
    });
    if (!currency) {
      throw new Error(`Currency "${code}" is not supported`);
    }
    return currency.id;
  }

  async get(organizationId: string): Promise<OrganizationSettings> {
    const row = await this.db.query.orgMetadata.findFirst({
      where: { orgId: organizationId },
      with: {
        country: true,
        currency: true,
      },
    });

    if (!row) {
      return {
        organizationId,
        country: null,
        currency: 'USD',
        tagline: null,
        taxNumber: null,
        address: null,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
      };
    }

    return {
      organizationId,
      country: row.country?.name ?? null,
      currency: row.currency?.code ?? null,
      tagline: row.tagline ?? null,
      taxNumber: row.vatNumber ?? null,
      address: row.address ?? null,
      phone: row.phone ?? null,
      whatsapp: row.whatsapp ?? null,
      email: row.email ?? null,
      website: row.website ?? null,
      timezone: row.timezone ?? 'UTC',
      dateFormat: row.dateFormat ?? 'DD/MM/YYYY',
    };
  }

  async update(
    organizationId: string,
    data: Partial<Omit<OrganizationSettings, 'organizationId'>>,
  ): Promise<OrganizationSettings> {
    const country = data.country ? await this.resolveCountry(data.country) : undefined;
    const countryId = country?.id;
    const currencyId = data.currency
      ? await this.resolveCurrencyId(data.currency)
      : country?.currencyId;

    await this.db
      .insert(orgMetadata)
      .values({
        orgId: organizationId,
        countryId,
        currencyId,
        vatNumber: data.taxNumber ?? undefined,
        tagline: data.tagline ?? undefined,
        address: data.address ?? undefined,
        phone: data.phone ?? undefined,
        whatsapp: data.whatsapp ?? undefined,
        email: data.email ?? undefined,
        website: data.website ?? undefined,
        timezone: data.timezone ?? undefined,
        dateFormat: data.dateFormat ?? undefined,
      })
      .onConflictDoUpdate({
        target: orgMetadata.orgId,
        set: {
          countryId: countryId ?? undefined,
          currencyId: currencyId ?? undefined,
          vatNumber: data.taxNumber ?? undefined,
          tagline: data.tagline ?? undefined,
          address: data.address ?? undefined,
          phone: data.phone ?? undefined,
          whatsapp: data.whatsapp ?? undefined,
          email: data.email ?? undefined,
          website: data.website ?? undefined,
          timezone: data.timezone ?? undefined,
          dateFormat: data.dateFormat ?? undefined,
        },
      });

    return this.get(organizationId);
  }

  async updateName(
    organizationId: string,
    name: string,
  ): Promise<{ organizationId: string; name: string }> {
    await this.db
      .update(organization)
      .set({ name })
      .where(eq(organization.id, organizationId));

    return { organizationId, name };
  }
}
