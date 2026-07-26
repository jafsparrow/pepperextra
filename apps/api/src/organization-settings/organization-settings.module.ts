import { Module } from '@nestjs/common';
import { OrganizationSettingsController } from './organization-settings.controller.js';
import { OrganizationSettingsService } from './organization-settings.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationSettingsController],
  providers: [OrganizationSettingsService],
  exports: [OrganizationSettingsService],
})
export class OrganizationSettingsModule {}
