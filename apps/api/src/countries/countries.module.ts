import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller.js';
import { CountriesService } from './countries.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
