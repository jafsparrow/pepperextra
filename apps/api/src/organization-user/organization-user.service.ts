import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthInstance } from '@pepperextra/auth';
import type {
  CreateOrganizationStaffUserDto,
  OrganizationStaffUser,
} from '@pepperextra/contracts';
import type { DatabaseClient } from '@pepperextra/db';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { DRIZZLE_TOKEN } from '../db/database.module.js';

@Injectable()
export class OrganizationUserService {
  private readonly users: OrganizationStaffUser[] = [];

  constructor(
    private authService: AuthService<AuthInstance>,
    @Inject(DRIZZLE_TOKEN) private db: DatabaseClient,
    private configService: ConfigService,
  ) {}

  async create(
    input: CreateOrganizationStaffUserDto,
    organizationId: string,
  ): Promise<OrganizationStaffUser> {
    // Pseudo: only enforce user limits in cloud deployments
    // const deploymentMode = this.configService.get<string>('VITE_DEPLOYMENT_MODE');
    // if (deploymentMode === 'cloud') {
    //   // Pseudo: look up the organization's license/plan
    //   // const license = await (this.db as any).execute(
    //   //   'SELECT plan FROM license WHERE organization_id = $1',
    //   //   [organizationId],
    //   // );
    //   // const plan = license?.rows?.[0]?.plan ?? 'basic';
    //   // const maxUsers = plan === 'pro' ? 20 : 5;
    //   //
    //   // // Count current members in the organization
    //   // const members = await this.db.query.member.findMany({
    //   //   where: { organizationId },
    //   // });
    //   //
    //   // if (members.length >= maxUsers) {
    //   //   throw new APIError('BAD_REQUEST', {
    //   //     message: `Your ${plan} plan allows a maximum of ${maxUsers} users. Upgrade to add more.`,
    //   //   });
    //   // }
    // }

    const temporaryPassword = this.generateTemporaryPassword();

    console.log('temporary password is:', temporaryPassword);
    // this.users.push(createdUser);
    const createdUserData = await this.authService.api.createUser({
      body: {
        email: input.email,
        name: input.name,
        password: temporaryPassword,
      },
    });

    const createdUser = createdUserData.user;

    // assign the user to the organisation. if there is an active team Id, add that too..
    const assignedTeam = await this.authService.api.addMember({
      body: {
        userId: createdUser.id,
        role: 'staff',
        organizationId: organizationId,
      },
    });

    console.log('assinged team is ', assignedTeam);
    return {
      name: createdUser.name,
      email: createdUser.email,
      organizationId: organizationId,
      id: createdUser.id,
      role: 'staff',
      status: 'active',
      temporaryPassword: temporaryPassword,
    };
  }

  async resetPassword(
    userId: string,
    organizationId: string,
  ): Promise<{
    success: boolean;
    temporaryPassword: string;
  }> {
    // [TODO] -this check is required once everything else is done. for usr check
    // const user = this.findById(id, organizationId);
    // if (!user) {
    //   throw new Error('Staff user not found for the provided organization');
    // }

    console.log(userId, organizationId);
    // check if the user belons to the given orgId, otherwise dont reset.
    const temporaryPassword = 'hellosuper'; // this.generateTemporaryPassword();

    const newUser = await this.authService.api.setUserPassword({
      body: {
        newPassword: temporaryPassword,
        userId,
      },
    });
    // user.temporaryPassword = temporaryPassword;
    return { success: newUser.status, temporaryPassword };
  }

  ban(
    id: string,
    organizationId: string,
    reason?: string,
  ): OrganizationStaffUser {
    const user = this.findById(id, organizationId);
    if (!user) {
      throw new Error('Staff user not found for the provided organization');
    }

    user.status = 'banned';
    user.banReason = reason ?? 'No reason provided';
    return user;
  }

  private findById(
    id: string,
    organizationId: string,
  ): OrganizationStaffUser | undefined {
    return this.users.find(
      (user) => user.id === id && user.organizationId === organizationId,
    );
  }

  private generateTemporaryPassword(): string {
    return `temp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  }
}
