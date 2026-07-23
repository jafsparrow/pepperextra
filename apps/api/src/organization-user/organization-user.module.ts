import { Module } from '@nestjs/common';
import { OrganizationUserController } from './organization-user.controller.js';
import { OrganizationUserService } from './organization-user.service.js';

@Module({
  controllers: [OrganizationUserController],
  providers: [OrganizationUserService],
  exports: [OrganizationUserService],
})
export class OrganizationUserModule {}
