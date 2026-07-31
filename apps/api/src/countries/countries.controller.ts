import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { CountriesService } from './countries.service.js';

@Controller()
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Implement(contracts.countries.list)
  list() {
    return implement(contracts.countries.list).handler(async () => {
      return this.countriesService.list();
    });
  }
}
