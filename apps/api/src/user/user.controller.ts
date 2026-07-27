import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import type { AuthInstance } from '@pepperextra/auth';
import { contracts } from '@pepperextra/contracts';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { UserService, type User } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): User[] {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): User | undefined {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() user: Omit<User, 'id'> & { id?: string }): User {
    return this.userService.create(user);
  }

  @Implement(contracts.user.resetPassword)
  resetPassword(@Session() session: UserSession<AuthInstance>) {
    return implement(contracts.user.resetPassword).handler(
      async ({ input }) => {
        const userId = session.session?.userId;
        if (!userId) {
          throw new Error('No authenticated user');
        }
        return this.userService.resetPassword(
          userId,
          input.currentPassword,
          input.newPassword,
        );
      },
    );
  }

  @Implement(contracts.user.changeOwnPassword)
  changeOwnPassword() {
    return implement(contracts.user.changeOwnPassword).handler(
      async ({ input }) => {
        const { currentPassword, newPassword } = input;
        return this.userService.changeOwnPassword(currentPassword, newPassword);
      },
    );
  }
}
