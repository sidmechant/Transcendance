import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChannelService } from 'src/channel/channel.service';

@Module({
  controllers: [MessageController],
  providers: [MessageService, CrudService, EventEmitter2, ChannelService],
})
export class MessageModule {}
