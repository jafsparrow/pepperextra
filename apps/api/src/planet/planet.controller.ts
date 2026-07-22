import { Controller, Inject } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts, Planet } from '@pepperextra/contracts';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@pepperextra/db';
import { user, dz } from '@pepperextra/db';

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
    return implement(contracts.planet.list).handler(async ({ input }) => {
      const { cursor, limit } = input;

      const usersResult = await this.database.select().from(user);

      console.log(usersResult);
      return planets;
    });
  }
}
