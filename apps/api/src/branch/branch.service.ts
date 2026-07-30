import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@thallesp/nestjs-better-auth';
import type { AuthInstance } from '@repo/auth';
import type { BranchInfoUpdate, BranchProfile } from '@repo/contracts';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class BranchService {
  constructor(
    private authService: AuthService<AuthInstance>,
    private configService: ConfigService,
  ) {}

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

  async updateInfo(
    teamId: string,
    data: BranchInfoUpdate,
  ): Promise<BranchProfile> {
    // Pseudo: update team name via Better Auth API
    // const updatedTeam = await this.authService.api.updateTeam({
    //   body: { name: data.name },
    //   params: { teamId },
    // });
    console.log('updateInfo called', { teamId, data });

    // TODO: persist tagline to branch profile table
    return Promise.resolve({
      teamId,
      organizationId: '',
      name: data.name,
      tagline: data.tagline ?? null,
      address: null,
      location: null,
      mapUrl: null,
      emblemImage: null,
      phone: null,
      email: null,
    });
  }

  async uploadEmblem(
    teamId: string,
    file: UploadedFile,
  ): Promise<{ url: string }> {
    const deploymentMode =
      this.configService.get<string>('DEPLOYMENT_MODE') ?? 'local';

    if (deploymentMode === 'local') {
      // Save to public folder
      const fs = await import('node:fs');
      const path = await import('node:path');
      const uploadDir = path.resolve(
        process.cwd(),
        '..',
        'web',
        'public',
        'uploads',
        'branches',
      );
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${teamId}-${Date.now()}${path.extname(file.originalname)}`;
      fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
      const url = `/uploads/branches/${filename}`;
      console.log('Emblem saved locally:', url);
      return { url };
    }

    // Pseudo: cloud upload to S3
    console.log(
      `[S3 Upload Placeholder] Uploaded emblem for team ${teamId}: ${file.originalname}`,
    );
    return { url: `https://s3-bucket.example.com/branches/${teamId}/emblem` };
  }
}
