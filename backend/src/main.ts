// backend/src/main.ts
console.log(`<<<<< [BACKEND main.ts] TOP OF FILE - SCRIPT EXECUTION STARTED - ${new Date().toISOString()} >>>>>`);
console.log(`[BACKEND main.ts] Attempting to load NestFactory...`);
import { NestFactory } from '@nestjs/core';
console.log(`[BACKEND main.ts] NestFactory loaded. Attempting to load AppModule...`);
import { AppModule } from './app.module';
console.log(`[BACKEND main.ts] AppModule loaded.`);
import { ValidationPipe } from '@nestjs/common';
console.log(`[BACKEND main.ts] ValidationPipe loaded.`);

async function bootstrap() {
  console.log(`<<<<< [BACKEND bootstrap()] CALLED - ${new Date().toISOString()} >>>>>`);
  
  console.log(`[BACKEND bootstrap()] Attempting to create Nest application...`);
  const app = await NestFactory.create(AppModule);
  console.log(`[BACKEND bootstrap()] Nest application created successfully.`);

  const frontendProductionUrl = 'https://my-speed-app-frontend.vercel.app'; 
  const vercelDeploymentPattern = new RegExp(
    `^https://my-speed-app-frontend-[a-zA-Z0-9]+-1billal1s-projects\.vercel\.app$`
  );
  const localFrontendUrl = 'http://localhost:3000';

  console.log(`[BACKEND bootstrap()] Configuring CORS...`);
  app.enableCors({
    origin: (origin, callback) => {
      const allowedExactOrigins = [
        frontendProductionUrl,
        localFrontendUrl,
      ];

      if (!origin || allowedExactOrigins.includes(origin) || vercelDeploymentPattern.test(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin - ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true, 
    preflightContinue: false,
    optionsSuccessStatus: 204, 
  });
  console.log(`[BACKEND bootstrap()] CORS configured.`);

  console.log(`[BACKEND bootstrap()] Setting up global ValidationPipe...`);
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    forbidNonWhitelisted: true, 
    transform: true, 
    transformOptions: {
      enableImplicitConversion: true, 
    },
  }));
  console.log(`[BACKEND bootstrap()] ValidationPipe configured.`);
  
  const port = process.env.PORT || 3001; // Vercel provides PORT
  console.log(`[BACKEND bootstrap()] Attempting to listen on port ${port}...`);
  await app.listen(port);
  console.log(`<<<<< [BACKEND bootstrap()] APPLICATION STARTED SUCCESSFULLY - ${new Date().toISOString()} >>>>>`);
  console.log(`NestJS application is running on port: ${port}`);
  console.log(`Application is effectively running on: ${await app.getUrl()}`);
}

bootstrap().catch(e => {
  console.error("BOOTSTRAP FAILED:", e);
  process.exit(1);
});