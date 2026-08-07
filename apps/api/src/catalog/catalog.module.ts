import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from '../db/database.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { CatalogVersionInterceptor } from './catalog-version.interceptor.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CatalogVersionInterceptor,
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
