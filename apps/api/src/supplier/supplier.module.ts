import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller.js';
import { SupplierService } from './supplier.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
