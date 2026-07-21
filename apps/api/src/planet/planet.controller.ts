import { Controller, Inject } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts, Planet } from '@pepperextra/contracts';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@pepperextra/db/client';
import { user } from '@pepperextra/db/auth-schema';

const planets: Planet[] = [
  {
    id: 1,
    name: 'pluto',
    description: 'some description',
  },
];

@Controller()
export class PlanetController {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly database: DatabaseClient,
  ) {}
  @Implement(contracts.planet.list)
  list() {
    return implement(contracts.planet.list).handler(({ input }) => {
      const { cursor, limit } = input;
      this.database.select().from(users);
      return planets;
    });
  }
}
