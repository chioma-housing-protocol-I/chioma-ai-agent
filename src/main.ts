import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RootConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<RootConfig, true>);
  const port = configService.get('app', { infer: true }).port;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chioma AI Agent')
    .setDescription(
      'Conversational AI agent for the Chioma rental platform — chat, tools, and session APIs.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.enableCors();
  await app.listen(port);

  console.log(`chioma-agent listening on port ${port}`);
  console.log(`OpenAPI docs: http://localhost:${port}/docs`);
}

void bootstrap();
