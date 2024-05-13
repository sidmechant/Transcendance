import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ChannelsController } from './channel/channel.controller';

dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Middleware pour les cookies
    app.use(cookieParser());

    // Configuration CORS
    app.enableCors({
      origin: process.env.FRONT_URL.toLowerCase(),
      credentials: true,
    });

    // Pipes globaux
    app.useGlobalPipes(new ValidationPipe());

    // Filtres d'exception globaux
    // app.useGlobalFilters(new AllExceptionsFilter());

    await app.listen(3000);

    const channelsController = app.get(ChannelsController);
    await channelsController.initializeAdmins();
    
    // const friendService = app.get(FriendsService);
    // await friendService.resetStatus();

    //call ChannelsController.initializeAdmin()
  } catch (error) {
    console.log("Error in main:", error);
  }
}

bootstrap();
