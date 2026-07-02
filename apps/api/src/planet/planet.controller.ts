import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts, Planet } from '@pepperextra/contracts';

const planets: Planet[] = [
  {
    id: 1,
    name: 'pluto',
    description: 'some description',
  },
];

@Controller()
export class PlanetController {
  @Implement(contracts.planet.list)
  list() {
    return implement(contracts.planet.list).handler(({ input }) => {
      const { cursor, limit } = input;

      return planets;
    });
  }
}
