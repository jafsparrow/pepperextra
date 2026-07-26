import { Module } from '@nestjs/common';
import { TeamSettingsController } from './team-settings.controller.js';
import { TeamSettingsService } from './team-settings.service.js';
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TeamSettingsController],
  providers: [TeamSettingsService],
  exports: [TeamSettingsService],
})
export class TeamSettingsModule {}
