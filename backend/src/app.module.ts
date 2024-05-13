import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from './users/users.module';
import { PlayersModule } from './players/players.module';
import { GameModule } from './game/game.module';
import { APP_GUARD } from '@nestjs/core';
import { TwoFactorAuthenticationGuard } from 'src/auth/2faGuard/TwoFactorAuthenticationGuard';
import { CrudService } from './auth/forty-twoapi/crud.service';
import { JwtAuthGuard } from './auth/jwt.guard';
import { ChatGatewayModule } from './chat/chat.gateway.module'; // Importez le module ChatGatewayModule
import { ChannelModule } from './channel/channel.module';
import { FriendsModule } from './friends/friends.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [AuthModule, PrismaModule, ChannelModule, SocketModule, ChatGatewayModule, UsersModule, PlayersModule, GameModule, FriendsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TwoFactorAuthenticationGuard,
    },
    CrudService,
  ],
})
export class AppModule {}
