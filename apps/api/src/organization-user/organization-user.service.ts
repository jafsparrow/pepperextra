import { Injectable } from '@nestjs/common';
import type {
  CreateOrganizationStaffUserDto,
  OrganizationStaffUser,
} from '@pepperextra/contracts';

@Injectable()
export class OrganizationUserService {
  private readonly users: OrganizationStaffUser[] = [];

  constructor() {}

  create(input: CreateOrganizationStaffUserDto): OrganizationStaffUser {
    const temporaryPassword = this.generateTemporaryPassword();
    const createdUser: OrganizationStaffUser = {
      id: `${Date.now()}-${this.users.length + 1}`,
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      role: 'staff',
      status: 'active',
      temporaryPassword,
    };

    this.users.push(createdUser);
    return createdUser;
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
