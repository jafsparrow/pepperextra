import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
}
