// import { Injectable } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { Friend, User } from '@prisma/client';
// import { GatewaySessionManager } from '../chat/chat.session';
// import { ChatGateway } from '../chat/chat.gateway';
// @Injectable()
// export class FriendRequestsEvents {
//   constructor(private readonly gateway: ChatGateway, private readonly sessionManager: GatewaySessionManager) {}

//   @OnEvent('friendrequest.create')
//   emitFriendRequestCreate(payload: Friend) {
//     const receiverSocket = this.gateway.sessionManager.getUserSocket(payload.friendId);
//     receiverSocket && receiverSocket.emit('onFriendRequestReceived', payload);
//   }

//   @OnEvent('friendrequest.cancel')
//   emitFriendRequestCancel(payload: Friend) {
//     const receiverSocket = this.gateway.sessionManager.getUserSocket(payload.friendId);
//     receiverSocket && receiverSocket.emit('onFriendRequestCancelled', payload);
//   }

//   @OnEvent('friendrequest.accept')
//   emitFriendRequestAccepted(payload: Friend) {
//     const senderSocket = this.gateway.sessionManager.getUserSocket(payload.userId);
//     senderSocket && senderSocket.emit('onFriendRequestAccepted', payload);
//   }

//   @OnEvent('friendrequest.reject')
//   emitFriendRequestRejected(payload: Friend) {
//     const senderSocket = this.gateway.sessionManager.getUserSocket(payload.userId);
//     senderSocket && senderSocket.emit('onFriendRequestRejected', payload);
//   }
// }


// Chaque fois que vous faites référence à receiverId dans votre code, remplacez-le par friendId car c'est ce que votre schéma Prisma utilise.
// Lorsque vous faites référence à la personne qui envoie ou initie la demande d'ami, utilisez userId.