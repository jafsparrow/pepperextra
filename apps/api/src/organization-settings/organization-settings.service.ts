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
        currencySymbol: '$',
        currencyDecimalPlaces: 2,
        tagline: null,
        taxNumber: null,
        address: null,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        onboardingCompleted: false,
      };
    }

    return {
      organizationId,
      country: row.country?.name ?? null,
      currency: row.currency?.code ?? null,
      currencySymbol: row.currency?.symbol ?? null,
      currencyDecimalPlaces: row.currency?.decimalPlaces ?? null,
      tagline: row.tagline ?? null,
      taxNumber: row.vatNumber ?? null,
      address: row.address ?? null,
      phone: row.phone ?? null,
      whatsapp: row.whatsapp ?? null,
      email: row.email ?? null,
      website: row.website ?? null,
      timezone: row.timezone ?? 'UTC',
      dateFormat: row.dateFormat ?? 'DD/MM/YYYY',
      onboardingCompleted: row.onboardingCompleted ?? false,
    };
  }

  async update(
    organizationId: string,
    data: Partial<Omit<OrganizationSettings, 'organizationId'>>,
  ): Promise<OrganizationSettings> {
    const updates: Partial<typeof orgMetadata.$inferInsert> = {};
    if (data.country) {
      const country = await this.resolveCountry(data.country);
      updates.countryId = country.id;
      if (!data.currency) {
        updates.currencyId = country.currencyId;
      }
    }
    if (data.currency) {
      updates.currencyId = await this.resolveCurrencyId(data.currency);
    }
    if (data.taxNumber !== undefined) updates.vatNumber = data.taxNumber;
    if (data.tagline !== undefined) updates.tagline = data.tagline;
    if (data.address !== undefined) updates.address = data.address;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp;
    if (data.email !== undefined) updates.email = data.email;
    if (data.website !== undefined) updates.website = data.website;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.dateFormat !== undefined) updates.dateFormat = data.dateFormat;
    if (data.onboardingCompleted !== undefined) {
      updates.onboardingCompleted = data.onboardingCompleted;
    }

    if (Object.keys(updates).length === 0) {
      return this.get(organizationId);
    }

    const existing = await this.db.query.orgMetadata.findFirst({
      where: { orgId: organizationId },
      columns: { orgId: true },
    });

    if (existing) {
      await this.db
        .update(orgMetadata)
        .set(updates)
        .where(eq(orgMetadata.orgId, organizationId));
    } else {
      const defaults = await resolveDefaultCountry(this.db);
      await this.db.insert(orgMetadata).values({
        orgId: organizationId,
        countryId: defaults.id,
        currencyId: defaults.currencyId,
        ...updates,
      });
    }

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

export async function resolveDefaultCountry(
  db: DatabaseClient,
): Promise<{ id: string; currencyId: string }> {
  const byId = await db.query.countries.findFirst({ where: { id: 'OM' } });
  if (byId) return { id: byId.id, currencyId: byId.currencyId };

  const byIso = await db.query.countries.findFirst({
    where: { isoCode: 'OM' },
  });
  if (byIso) return { id: byIso.id, currencyId: byIso.currencyId };

  const any = await db.query.countries.findFirst({ where: { isActive: true } });
  if (any) return { id: any.id, currencyId: any.currencyId };

  throw new Error('No default country configured in the countries table');
}
