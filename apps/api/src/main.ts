import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod';
import { contracts } from '@repo/contracts';
import swaggerUi from 'swagger-ui-express';

async function bootstrap() {
  console.log('Starting NestJS application...');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: [
      'http://localhost:3001', // TanStack Start
      'http://localhost:8081', // if you ever use Expo web
      // you can also add production domains later
    ],
    credentials: true, // still needed for cookies
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'x-orpc-*',
      'expo-origin', // useful for Better Auth Expo
    ],
    // optional but sometimes helpful:
    // exposedHeaders: ['Set-Cookie'],
  });

  // console.log('nest js proces env', process.env);

  // const generator = new OpenAPIGenerator({
  //   schemaConverters: [new ZodToJsonSchemaConverter()],
  // });
  // const spec = await generator.generate(contracts, {
  //   info: {
  //     title: 'planets api',
  //     version: '1.0',
  //   },
  // });

  // const expressApp = app.getHttpAdapter().getInstance();
  // expressApp.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
