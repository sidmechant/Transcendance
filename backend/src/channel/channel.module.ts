import { Module } from '@nestjs/common';
import { ChannelsController } from './channel.controller';
import { ChannelService } from './channel.service';
import { CrudService } from '../auth/forty-twoapi/crud.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { GatewaySessionManager } from '../chat/chat.session';
import { FriendsService } from '../friends/friends.service';
import { MessageService } from '../message/message.service';
import { SocketModule } from '../socket/socket.module';
import { ChatGatewayModule } from '../chat/chat.gateway.module';

@Module({
	providers: [MessageService, FriendsService, GatewaySessionManager, CrudService, ChannelService, UsersService, EventEmitter2],
	controllers: [ChannelsController],
	exports: [ChannelService],
	imports: [ChatGatewayModule, SocketModule],

})
export class ChannelModule {}
