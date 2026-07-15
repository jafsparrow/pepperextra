import { Injectable } from '@nestjs/common';

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
}
