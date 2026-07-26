import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@pepperextra/contracts';
import { TeamSettingsService } from './team-settings.service.js';

@Controller()
export class TeamSettingsController {
  constructor(private readonly teamSettingsService: TeamSettingsService) {}

  @Implement(contracts.teamSettings.get)
  getSettings() {
    return implement(contracts.teamSettings.get).handler(async ({ input }) => {
      return this.teamSettingsService.getTeamSettings(input.teamId);
    });
  }

  @Implement(contracts.teamSettings.update)
  updateSettings() {
    return implement(contracts.teamSettings.update).handler(
      async ({ input }) => {
        const { teamId, ...data } = input;
        return this.teamSettingsService.updateTeamSettings(teamId, data);
      },
    );
  }

  @Implement(contracts.taxConfig.list)
  listTaxes() {
    return implement(contracts.taxConfig.list).handler(async ({ input }) => {
      return this.teamSettingsService.listTaxConfigs(input.teamId);
    });
  }

  @Implement(contracts.taxConfig.create)
  createTax() {
    return implement(contracts.taxConfig.create).handler(async ({ input }) => {
      const { teamId, organizationId, name, rate, type, isDefault, active } =
        input;
      return this.teamSettingsService.createTaxConfig({
        teamId,
        organizationId,
        name,
        rate,
        type,
        isDefault,
        active,
      });
    });
  }

  @Implement(contracts.taxConfig.update)
  updateTax() {
    return implement(contracts.taxConfig.update).handler(async ({ input }) => {
      const { teamId: _teamId, id, ...data } = input;
      console.log(_teamId);
      return this.teamSettingsService.updateTaxConfig(id, data);
    });
  }

  @Implement(contracts.taxConfig.delete)
  deleteTax() {
    return implement(contracts.taxConfig.delete).handler(async ({ input }) => {
      await this.teamSettingsService.deleteTaxConfig(input.id);
      return { success: true };
    });
  }

  @Implement(contracts.serviceCharge.list)
  listCharges() {
    return implement(contracts.serviceCharge.list).handler(
      async ({ input }) => {
        return this.teamSettingsService.listServiceCharges(input.teamId);
      },
    );
  }

  @Implement(contracts.serviceCharge.create)
  createCharge() {
    return implement(contracts.serviceCharge.create).handler(
      async ({ input }) => {
        const {
          teamId,
          organizationId,
          name,
          amount,
          type,
          isDefault,
          active,
        } = input;
        return this.teamSettingsService.createServiceCharge({
          teamId,
          organizationId,
          name,
          amount,
          type,
          isDefault,
          active,
        });
      },
    );
  }

  @Implement(contracts.serviceCharge.update)
  updateCharge() {
    return implement(contracts.serviceCharge.update).handler(
      async ({ input }) => {
        const { teamId: _teamId, id, ...data } = input;
        console.log(_teamId);
        return this.teamSettingsService.updateServiceCharge(id, data);
      },
    );
  }

  @Implement(contracts.serviceCharge.delete)
  deleteCharge() {
    return implement(contracts.serviceCharge.delete).handler(
      async ({ input }) => {
        await this.teamSettingsService.deleteServiceCharge(input.id);
        return { success: true };
      },
    );
  }
}
