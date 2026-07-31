import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseClient } from '@repo/db';
import type { Country } from '@repo/contracts';
import { DRIZZLE_TOKEN } from '../db/database.module.js';

@Injectable()
export class CountriesService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async list(): Promise<Country[]> {
    const rows = await this.db.query.countries.findMany({
      where: { isActive: true },
      with: { currency: true },
      orderBy: (country, { asc }) => [asc(country.name)],
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      isoCode: row.isoCode,
      currencyCode: row.currency?.code ?? '',
      currencySymbol: row.currency?.symbol ?? '',
    }));
  }
}
