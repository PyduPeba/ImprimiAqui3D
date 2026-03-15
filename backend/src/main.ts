import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // IMPORTANT: Disable the default body parser so Multer can handle multipart/form-data
  // If the default body parser runs first, it consumes the request stream before Multer can read the file
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Manually register body parsers with 100MB limit, but ONLY for non-multipart requests
  const expressApp = app.getHttpAdapter().getInstance();
  const logger = new Logger('Bootstrap'); // Move logger up

  expressApp.use((req: any, res: any, next: any) => {
    const contentType = req.headers['content-type'] || '';
    const method = req.method;
    const url = req.url;
    
    if (url.includes('/inventory') && method === 'POST') {
        const size = req.headers['content-length'] ? (parseInt(req.headers['content-length']) / 1024 / 1024).toFixed(2) + 'MB' : 'unknown';
        logger.log(`[Request] ${method} ${url} - Size: ${size}`);
    }

    if (contentType.startsWith('multipart/')) {
      // Let Multer handle multipart requests - do NOT parse the body here
      return next();
    }
    // For all other requests, apply the json body parser
    require('express').json({ limit: '100mb' })(req, res, (err: any) => {
      if (err) {
        logger.error(`[BodyParser] Error: ${err.message}`);
        return next(err);
      }
      require('express').urlencoded({ limit: '100mb', extended: true })(req, res, next);
    });
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefixo global da API
  app.setGlobalPrefix(apiPrefix);

  // Habilitar CORS
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        configService.get<string>('CORS_ORIGIN'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001'
      ];

      if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
