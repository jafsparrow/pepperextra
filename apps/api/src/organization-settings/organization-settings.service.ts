import { Injectable } from '@nestjs/common';
import type { OrganizationSettings } from '@pepperextra/contracts';

@Injectable()
export class OrganizationSettingsService {
  async get(organizationId: string): Promise<OrganizationSettings> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
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
    });
  }

  async update(
    organizationId: string,
    data: Partial<Omit<OrganizationSettings, 'organizationId'>>,
  ): Promise<OrganizationSettings> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      organizationId,
      country: data.country ?? null,
      currency: data.currency ?? 'USD',
      tagline: data.tagline ?? null,
      taxNumber: data.taxNumber ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      timezone: data.timezone ?? 'UTC',
      dateFormat: data.dateFormat ?? 'DD/MM/YYYY',
    });
  }
}
