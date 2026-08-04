import { Module } from '@nestjs/common';
import { PriceListController } from './price-list.controller.js';
import { PriceListService } from './price-list.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PriceListController],
  providers: [PriceListService],
  exports: [PriceListService],
})
export class PriceListModule {}
