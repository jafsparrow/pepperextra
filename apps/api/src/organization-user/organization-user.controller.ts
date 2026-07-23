import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { contracts } from '@pepperextra/contracts';
import { OrganizationUserService } from './organization-user.service.js';

// type ResetPasswordInput = (typeof contracts)['organizationStaffUser']['']['input'];
// type ResetPasswordOutput = (typeof contracts)['organizationStaffUser']['resetPassword']['output'];

// type BanInput = (typeof contracts)['organizationStaffUser']['ban']['input'];
// type BanOutput = (typeof contracts)['organizationStaffUser']['ban']['output'];

@Controller()
export class OrganizationUserController {
  constructor(
    private readonly organizationUserService: OrganizationUserService,
  ) {}

  @Implement(contracts.organizationStaffUser.create)
  create() {
    return implement(contracts.organizationStaffUser.create).handler(
      ({ input }) => {
        return {
          email: 'sdf',
          id: 'LK',
          name: 'dksdf',
          organizationId: 'dfd23232323',
          role: 'staff',
          status: 'active',
          banReason: 'lsdjf',
          temporaryPassword: 'sdf',
        };
      },
    );
  }

  @Implement(contracts.organizationStaffUser.resetPassword)
  resetPassword() {
    return implement(contracts.organizationStaffUser.resetPassword).handler(
      ({ input }) => {
        return this.organizationUserService.resetPassword(
          input.id,
          input.organizationId,
        );
      },
    );
  }

  @Implement(contracts.organizationStaffUser.ban)
  ban() {
    return implement(contracts.organizationStaffUser.ban).handler(
      ({ input }) => {
        return this.organizationUserService.ban(
          input.id,
          input.organizationId,
          input.reason,
        );
      },
    );
  }
}
