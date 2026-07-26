import { Injectable } from '@nestjs/common';
import type { BranchProfile } from '@pepperextra/contracts';

@Injectable()
export class BranchService {
  async getProfile(teamId: string): Promise<BranchProfile> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      teamId,
      organizationId: '',
      name: 'Branch Name',
      tagline: 'Fresh ingredients, bold flavors',
      address: '123 Main Street, Downtown, City 12345',
      location: '25.2048,55.2708',
      mapUrl: null,
      emblemImage: null,
      phone: '+1 (555) 123-4567',
      email: 'branch@restaurant.com',
    });
  }

  async updateProfile(
    teamId: string,
    data: Partial<Omit<BranchProfile, 'teamId' | 'organizationId' | 'name'>>,
  ): Promise<BranchProfile> {
    console.log(data);
    // TODO: implement when db tables are defined
    return Promise.resolve({
      teamId,
      organizationId: '',
      name: 'Branch Name',
      tagline: 'Fresh ingredients, bold flavors',
      address: '123 Main Street, Downtown, City 12345',
      location: '25.2048,55.2708',
      mapUrl: null,
      emblemImage: null,
      phone: '+1 (555) 123-4567',
      email: 'branch@restaurant.com',
    });
  }
}
