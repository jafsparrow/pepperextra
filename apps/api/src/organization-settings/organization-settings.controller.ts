import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@repo/contracts';
import { OrganizationSettingsService } from './organization-settings.service.js';

@Controller()
export class OrganizationSettingsController {
  constructor(private readonly settingsService: OrganizationSettingsService) {}

  @Implement(contracts.organizationSettings.get)
  get() {
    return implement(contracts.organizationSettings.get).handler(
      async ({ input }) => {
        return this.settingsService.get(input.organizationId);
      },
    );
  }

  @Implement(contracts.organizationSettings.update)
  update() {
    return implement(contracts.organizationSettings.update).handler(
      async ({ input }) => {
        const { organizationId, ...data } = input;
        return this.settingsService.update(organizationId, data);
      },
    );
  }

  @Implement(contracts.organizationSettings.updateName)
  updateName() {
    return implement(contracts.organizationSettings.updateName).handler(
      async ({ input }) => {
        const { organizationId, name } = input;
        return this.settingsService.updateName(organizationId, name);
      },
    );
  }
}
