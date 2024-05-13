import { Injectable } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatGatewayService {
  constructor(private readonly chatGateway: ChatGateway) {}

  sendMessage(message: string): void {
    // Ajoutez ici la logique pour envoyer un message à tous les clients connectés
    // Vous pouvez utiliser this.chatGateway pour accéder à la passerelle WebSocket
    const formattedMessage = `Nouveau message : ${message}`;
    // this.chatGateway.(formattedMessage);
  }
}
