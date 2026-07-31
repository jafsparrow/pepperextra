import { Module } from '@nestjs/common';
import { ProductGroupController } from './product-group.controller.js';
import { ProductGroupService } from './product-group.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductGroupController],
  providers: [ProductGroupService],
  exports: [ProductGroupService],
})
export class ProductGroupModule {}
