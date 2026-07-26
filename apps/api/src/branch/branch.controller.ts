import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@pepperextra/contracts';
import { BranchService } from './branch.service.js';

@Controller()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Implement(contracts.branchProfile.get)
  getProfile() {
    return implement(contracts.branchProfile.get).handler(async ({ input }) => {
      return this.branchService.getProfile(input.teamId);
    });
  }

  @Implement(contracts.branchProfile.update)
  updateProfile() {
    return implement(contracts.branchProfile.update).handler(
      async ({ input }) => {
        const { teamId, ...data } = input;
        return this.branchService.updateProfile(teamId, data);
      },
    );
  }
}
