import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Implement } from '@orpc/nest';
import { implement } from '@orpc/server';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthInstance } from '@repo/auth';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { contracts } from '@repo/contracts';
import { ProductService } from './product.service.js';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Implement(contracts.product.list)
  list() {
    return implement(contracts.product.list).handler(async ({ input }) => {
      return this.productService.listProducts(input);
    });
  }

  @Implement(contracts.product.get)
  get(@Session() session: UserSession<AuthInstance>) {
    return implement(contracts.product.get).handler(async ({ input }) => {
      return this.productService.getProduct(
        input.organizationId,
        input.id,
        session,
      );
    });
  }

  @Implement(contracts.product.create)
  create() {
    return implement(contracts.product.create).handler(async ({ input }) => {
      const { organizationId, ...data } = input;
      return this.productService.createProduct(organizationId, data);
    });
  }

  @Implement(contracts.product.update)
  update() {
    return implement(contracts.product.update).handler(async ({ input }) => {
      const { organizationId, id, ...data } = input;
      return this.productService.updateProduct(id, organizationId, data);
    });
  }

  @Implement(contracts.product.delete)
  delete() {
    return implement(contracts.product.delete).handler(async ({ input }) => {
      await this.productService.deleteProduct(input.organizationId, input.id);
      return { success: true };
    });
  }

  @Post('organizations/:organizationId/products/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @UploadedFile() file: UploadedFile,
  ) {
    return this.productService.uploadImage(organizationId, id, file);
  }
}
