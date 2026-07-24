import { Injectable } from '@nestjs/common';
import { AuthInstance } from '@pepperextra/auth';
import type {
  CreateOrganizationStaffUserDto,
  OrganizationStaffUser,
} from '@pepperextra/contracts';
import { AuthService } from '@thallesp/nestjs-better-auth';

@Injectable()
export class OrganizationUserService {
  private readonly users: OrganizationStaffUser[] = [];

  constructor(private authService: AuthService<AuthInstance>) {}

  async create(
    input: CreateOrganizationStaffUserDto,
    organizationId: string,
  ): Promise<OrganizationStaffUser> {
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

  resetPassword(id: string, organizationId: string): OrganizationStaffUser {
    const user = this.findById(id, organizationId);
    if (!user) {
      throw new Error('Staff user not found for the provided organization');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    user.temporaryPassword = temporaryPassword;
    return user;
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
