import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { PlayersService } from 'src/players/players.service';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [FriendsService, PlayersService, CrudService, EventEmitter2], // Ajoutez EventEmitter aux providers
  controllers: [FriendsController],
})
export class FriendsModule {}
