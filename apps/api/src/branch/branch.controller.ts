import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { FileInterceptor } from '@nestjs/platform-express';
import { contracts } from '@pepperextra/contracts';
import { BranchService } from './branch.service.js';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Implement(contracts.branchProfile.get)
  getProfile() {
    return implement(contracts.branchProfile.get).handler(async ({ input }) => {
      return this.branchService.getProfile(input.teamId);
    });
  }

  @Implement(contracts.branchProfile.update)
  updateProfile() {
    return implement(contracts.branchProfile.update).handler(
      async ({ input }) => {
        const { teamId, ...data } = input;
        return this.branchService.updateProfile(teamId, data);
      },
    );
  }

  @Implement(contracts.branchProfile.updateInfo)
  updateInfo() {
    return implement(contracts.branchProfile.updateInfo).handler(
      async ({ input }) => {
        const { teamId, ...data } = input;
        return this.branchService.updateInfo(teamId, data);
      },
    );
  }

  @Post('teams/:teamId/emblem')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEmblem(
    @Param('teamId') teamId: string,
    @UploadedFile() file: UploadedFile,
  ) {
    return this.branchService.uploadEmblem(teamId, file);
  }
}
