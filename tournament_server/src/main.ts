import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('api')
    .build();

  // Determine environment
  const isDev = process.env.NODE_ENV !== 'production';

  // Read CORS origins from env variable
  const originsEnv = process.env.CORS_ORIGIN || '';
  const origins = originsEnv
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  
  console.log(`CORS Origins: ${origins}`)

  app.enableCors({
    origin: origins, 
    methods: ['GET', 'OPTIONS', 'HEAD', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
	preflightContinue: false,
    optionsSuccessStatus: 204
  });

  app.useWebSocketAdapter(new WsAdapter(app));

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}


bootstrap();