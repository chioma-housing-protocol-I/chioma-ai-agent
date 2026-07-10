import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RootConfig } from './config/env.validation';

export function applySecurityHeaders(app: Pick<INestApplication, 'use'>): void {
  app.use(helmet());
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<RootConfig, true>);
  const port = configService.get('app', { infer: true }).port;

  applySecurityHeaders(app);
  app.enableCors();
  await app.listen(port);

  console.log(`chioma-agent listening on port ${port}`);
}

if (require.main === module) {
  void bootstrap();
}
