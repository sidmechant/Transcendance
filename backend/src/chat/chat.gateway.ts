import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewaySessionManager } from './chat.session'; // Importez votre gestionnaire de sessions
import { OnEvent } from '@nestjs/event-emitter';
import { Friend, Message, User, UserStatus } from '@prisma/client';
import { ChannelSocketDto, MessageSocketDto } from 'src/dto/chat.dto';
import { MessageService } from 'src/message/message.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})


export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger: Logger = new Logger('ChatGatway');

  @WebSocketServer()
  server: Server;

  constructor(
    public readonly sessionManager: GatewaySessionManager,   private readonly eventEmitter: EventEmitter2, // Injectez votre GatewaySessionManager
    private readonly messageService: MessageService
  ) {}


  handleConnection(client: Socket) {
    //console.log("QUERY = ", client.handshake.query);
    const token = client.handshake.query.jwt_token as string;
    // Utilisez votre sessionManager pour associer le socket à l'utilisateur

    if (token && token !== 'undefined' && token !== 'null') {
      this.sessionManager.setUserSocket(token, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    // Utilisez votre sessionManager pour supprimer le socket de l'utilisateur lorsqu'il se déconnecte
    const token = client.handshake.query.jwt_token as string;
    this.sessionManager.removeUserSocket(token, client.id);
  }

  @SubscribeMessage('manualConnect')
  handleManualConnect(@ConnectedSocket() client: Socket) {
    const token = client.handshake.query.jwt_token as string;

    if (token && token !== 'undefined' && token !== 'null') {
      this.sessionManager.setUserSocket(token, client.id);
    }
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(@MessageBody() channel: string, @ConnectedSocket() client: Socket) {
    client.join(channel);
  }

  @SubscribeMessage('inGame')
  handleInGame(@ConnectedSocket() client: Socket, @MessageBody() inGame: boolean) {
    const token = client.handshake.query.jwt_token as string;
    this.sessionManager.setInGameStatus(token, (inGame) ? 'IN_GAME' : 'ONLINE');
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): void {
    const formattedMessage = `Nouveau message : ${message}`;
    console.log(message);
    this.server.emit('message', formattedMessage);
  }

  @OnEvent('friendrequest.create')
  emitFriendRequestCreate(payload: Friend) {
    const receiverSocket = this.sessionManager.getUserSocket(payload.friendId);
    receiverSocket && receiverSocket.emit('onFriendRequestReceived', payload);
  }

  @OnEvent('friendrequest.cancel')
  emitFriendRequestCancel(payload: Friend) {
    const receiverSocket = this.sessionManager.getUserSocket(payload.friendId);
    receiverSocket && receiverSocket.emit('onFriendRequestCancelled', payload);
  }

  @OnEvent('friendrequest.accept')
  emitFriendRequestAccepted(payload: Friend) {
    const senderSocket = this.sessionManager.getUserSocket(payload.userId);
    senderSocket && senderSocket.emit('onFriendRequestAccepted', payload);
  }

  @OnEvent('friendrequest.reject')
  emitFriendRequestRejected(payload: Friend) {
    const senderSocket = this.sessionManager.getUserSocket(payload.userId);
    senderSocket && senderSocket.emit('onFriendRequestRejected', payload);
  }
   
  /* *************************** CHANNEL ****************************************** */
  
  @SubscribeMessage('onChannelJoin')
  onChannelJoin(@MessageBody() data: ChannelSocketDto, @ConnectedSocket() client: Socket) {  
    client.join(`channel-${data.channel.id}`);
    console.log(client.rooms);
    this.server.to(`channel-${data.channel.id}`).emit('userJoin');
  }


  @SubscribeMessage('onChannelLeave')
  onChannelLeave(@MessageBody() data: ChannelSocketDto, @ConnectedSocket() client: Socket) {
    this.server.to(`Channel-${data.channel.id}`).emit('userLeave');
    client.leave(`Channel-${data.channel.id}`);
    console.log('onChannelLeave');
    console.log(client.rooms);
  }
  
  @OnEvent('channel.create')
  handleChannelCreate(payload: ChannelSocketDto) {
    /*** debug */
    this.server.emit("onChannel", payload);
    this.logger.log('event onChannel');
    /*** debug */

    console.log(`Inside conversation.create ${payload.creator.id}`);
    const client = this.sessionManager.getUserSocket(payload.creator.id);
    if (client) {
      client.join(`channel-${payload.channel.id}`);
      client.emit('onChannel', payload);
      this.server.to('onChannel').emit("onChannel", payload);
      this.logger.log('event onChannel');
    }
     this.logger.error('event onChannel failed');
  }
  
  @OnEvent('channel.create')
  handletest(payload: any) {
    this.server.emit("onChannel", payload);
    this.logger.log('event onChannel');
  }
  /* ****************************** MESSAGE *************************************** */

  @OnEvent('message.send')
  handleMessageSend(channelName, message: string) {
    try {
      this.server.to(channelName).emit('newMessage', message);
    } catch (error) {
      return ;
    }
  }

  @OnEvent('message.create')
  handleMessageCreateEvent(payload: MessageSocketDto) {
    console.log('Inside message.create');
    const { author, recipient, message } = payload;

    const authorSocket: any | null = this.sessionManager.getUserSocket(author.id);
    const recipientSocket: any | null = this.sessionManager.getUserSocket(recipient.id);

    if (authorSocket) authorSocket.emit('onMessage', payload);
    if (recipientSocket) recipientSocket.emit('onMessage', payload);
  }

  @OnEvent('message.delete')
  async handleMessageDelete(payload: MessageSocketDto) {
    console.log('Inside message.delete');
    console.log(payload);
    const message = await this.messageService.findMessageByMessageId(payload.message.id);
    if (!message) return;
    const creator = this.sessionManager.getUserSocket(message.userId);
    if (creator) creator.emit('onMessageDelete', payload);
  }

  @OnEvent('message.update')
  async handleMessageUpdate(message: MessageSocketDto) {
    const { author, recipient }= message;
    console.log(message);
    const recipientSocket = this.sessionManager.getUserSocket(message.message.userId)
    recipientSocket.emit('onMessageUpdate', message);
  }


  /////////////////////////////////**************************************************************************************** */
    /////////////////////////// KICK BAN MUTE ////////////////////////////////////////////////////////////////////////

  //   @OnEvent('userAdminChanged')
  //   handleUserAdminChanged(payload: { channelId: string; userId: number; isAdmin: boolean }) {
  //     const { channelId, userId, isAdmin } = payload;
  //     // Vous pouvez envoyer un événement WebSocket à tous les utilisateurs du canal pour les informer du changement
  //     this.server.to(`channel-${channelId}`).emit('userAdminChanged', { userId, isAdmin });
  //   }
    
  
  //   @OnEvent('userBanned')
  //   emitUserBanned(payload: any) {
  //     const { channelId, userId, isBanned } = payload;
  //     this.server.to(`channel-${channelId}`).emit('userBanned', {
  //       userId,
  //       isBanned,
  //     });
  //   }
  
  //   @OnEvent('userRemoved')
  // emitUserRemoved(payload: any) {
  //   // Exemple : récupérez les données pertinentes depuis payload
  //   const { channelId, userId } = payload;
  
  //   this.server.to(`channel-${channelId}`).emit('userRemoved', {
  //     userId,
  //   });
  //   }
  
  //   @OnEvent('userMuted')
  // emitUserMuted(payload: any) {
  //   // Exemple : récupérez les données pertinentes depuis payload
  //   const { channelId, userId, mutedUntil } = payload;
  
  //   this.server.to(`channel-${channelId}`).emit('userMuted', {                                                                          
  //     userId,
  //     mutedUntil,
  //   });
  // }
  

}