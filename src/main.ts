import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Planner-course-api')
    .setDescription('The doc API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const corsOrigins = configService.get<string[]>('app.cors.origins', []);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  if (nodeEnv === 'production') {
    console.log(`✅ CORS настроен для origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'none (требуется CORS_ORIGINS)'}`);
  }
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = configService.get<number>('app.port', 8080);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
