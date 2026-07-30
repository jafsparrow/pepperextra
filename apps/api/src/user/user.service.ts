import { Injectable } from '@nestjs/common';
import type { AuthInstance } from '@repo/auth';
import { AuthService } from '@thallesp/nestjs-better-auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable()
export class UserService {
  private readonly users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user' },
  ];

  constructor(private readonly authService: AuthService<AuthInstance>) {}
  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(user: Omit<User, 'id'> & { id?: string }): User {
    const newUser: User = {
      id: user.id ?? `${this.users.length + 1}`,
      name: user.name,
      email: user.email,
      role: user.role ?? 'user',
    };

    this.users.push(newUser);
    return newUser;
  }

  async resetPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const ctx = await this.authService.instance.$context;

    const accounts = await ctx.internalAdapter.findAccountByUserId(userId);
    const emailAccount = accounts?.find(
      (account) => account.providerId === 'email',
    );
    if (!emailAccount?.password) {
      throw new Error('No password account found for this user');
    }

    const isValid = await ctx.password.verify({
      password: currentPassword,
      hash: emailAccount.password,
    });
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hash = await ctx.password.hash(newPassword);
    await ctx.internalAdapter.updatePassword(userId, hash);
    await ctx.internalAdapter.updateUser(userId, {
      passwordResetRequired: false,
    });

    return { success: true };
  }
  async changeOwnPassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    await this.authService.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true, // kills other sessions on password change
      },
    });
    return { success: true };
  }
}
