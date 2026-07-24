import { Controller } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { AuthInstance } from '@pepperextra/auth';
import { contracts } from '@pepperextra/contracts';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
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
  create(@Session() session: UserSession<AuthInstance>) {
    return implement(contracts.organizationStaffUser.create).handler(
      ({ input }) => {
        const organizationId = session.session?.activeOrganizationId;

        console.log('seesion is ', session);
        if (!organizationId) {
          throw new Error('No active organization selected for this session');
        }

        return this.organizationUserService.create(
          {
            ...input,
          },
          organizationId,
        );
      },
    );
  }

  @Implement(contracts.organizationStaffUser.resetPassword)
  resetPassword(@Session() session: UserSession<AuthInstance>) {
    return implement(contracts.organizationStaffUser.resetPassword).handler(
      async ({ input }) => {
        const organizationId = session.session?.activeOrganizationId;

        if (!organizationId) {
          throw new Error('No active organization selected for this session');
        }

        const response = await this.organizationUserService.resetPassword(
          input.id,
          organizationId,
        );
        return {
          id: input.id,
          organizationId,
          temporaryPassword: response.temporaryPassword,
        };
      },
    );
  }

  @Implement(contracts.organizationStaffUser.ban)
  ban(@Session() session: UserSession<AuthInstance>) {
    return implement(contracts.organizationStaffUser.ban).handler(
      ({ input }) => {
        const organizationId =
          input.organizationId ?? session.session?.activeOrganizationId;

        if (!organizationId) {
          throw new Error('No active organization selected for this session');
        }

        return this.organizationUserService.ban(
          input.id,
          organizationId,
          input.reason,
        );
      },
    );
  }
}
