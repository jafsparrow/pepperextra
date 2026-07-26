import { Module } from '@nestjs/common';
import { OrganizationUserController } from './organization-user.controller.js';
import { OrganizationUserService } from './organization-user.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationUserController],
  providers: [OrganizationUserService],
  exports: [OrganizationUserService],
})
export class OrganizationUserModule {}
