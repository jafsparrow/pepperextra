import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller.js';
import { BranchService } from './branch.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
