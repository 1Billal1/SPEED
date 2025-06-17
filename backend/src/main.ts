import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendProductionUrl = 'https://my-speed-app-frontend.vercel.app'; 

  const vercelDeploymentPattern = new RegExp(
    `^https://my-speed-app-frontend-[a-zA-Z0-9]+-1billal1s-projects\.vercel\.app$`
  );
  const localFrontendUrl = 'http://localhost:3000';


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

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    forbidNonWhitelisted: true, 
    transform: true, 
    transformOptions: {
      enableImplicitConversion: true, 
    },
  }));
  
  const port = process.env.PORT || 3001; // Vercel provides PORT
  await app.listen(port);
  console.log(`NestJS application is running on port: ${port}`);
  console.log(`Application is effectively running on: ${await app.getUrl()}`);
}
bootstrap();