import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Player } from './types/machine';
import { Match } from './Match';
import Paddle from './physic/Paddle';
import { verify } from 'jsonwebtoken';
import { PlayersService } from 'src/players/players.service';
import { GameService } from './game.service';

interface ScoreData {
  playerAPseudo: string;
  playerBPseudo: string;
  scoreA: number;
  scoreB: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

export class GameGateway {
  constructor(private readonly playersService: PlayersService, private GameService: GameService) { }

  private clients: { [key: string]: Socket } = {};
  private match: Match = new Match();

  private getPseudoBySocket(client: Socket, callback: (pseudo: string) => void): void {
    if (!(client.handshake.query.jwt_token as string)) return;
    try {
      client.handshake.query.jwt_token as string;
      const decoded = verify(client.handshake.query.jwt_token as string, process.env.JWT_SECRET);
      const id = decoded.sub;

      this.playersService.getPlayerById(Number(id))
        .then(player => {
          callback(player.pseudo);
        })
        .catch(err => {
          console.error("Error:", err);
        });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  private handleLogEvent(client: Socket, event: string, message?: string): void {
    this.getPseudoBySocket(client, (pseudo) => {
      if (!pseudo) return;
      console.log('Client', pseudo + ':', event + ((message) ? (': ' + message) : ''));
    });
  }

  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {

    const referer = client.handshake.headers.referer;
    console.log(`Connection made from: ${referer}`);
    this.getPseudoBySocket(client, (pseudo) => {
      if (!pseudo) return;
      this.clients[pseudo] = client;
      this.handleLogEvent(client, 'connection');
    });
  }

  handleDisconnect(client: Socket) {
    this.getPseudoBySocket(client, (pseudo) => {
      if (!pseudo) return;
      delete this.clients[pseudo];
      this.match.remove(client);
      this.handleLogEvent(client, 'disconnect');
    });
  }

  @SubscribeMessage('ball')
  handleEventBall(@ConnectedSocket() client: Socket): void {
    this.match.getRoom(client).ball(client);
    // this.handleLogEvent(client, 'ball');
  }

  @SubscribeMessage('chooseMap')
  handleEventChooseMap(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { map: Player['map'] },
  ): void {
    this.match.getRoom(client).chooseMap(client, data.map);
    this.handleLogEvent(client, 'chooseMap', data.map);
  }

  @SubscribeMessage('matchMaking')
  handleEventMatchMaking(@ConnectedSocket() client: Socket): void {
    this.getPseudoBySocket(client, (pseudo) => {
      if (!pseudo) return;
      this.match.add(client, pseudo, 'matchMaking');
      this.handleLogEvent(client, 'matchMaking');
    });
  }

  @SubscribeMessage('friendlyMatch')
  handleEventFriendlyMatch(@ConnectedSocket() client: Socket, @MessageBody() invite: string): void {
    this.getPseudoBySocket(client, (pseudo) => {
      if (!pseudo) return;
      const room = this.match.add(client, pseudo, 'friendlyMatch');
      if (room != -1) {
        const inviteSocket = this.clients[invite];
        if (pseudo !== invite && inviteSocket) {
          inviteSocket.emit('newEvent', { target: pseudo, type: 'game', content: `${pseudo} invite you for a game.`, room: room });
          client.emit('friendlyMatch', true);
          this.handleLogEvent(client, 'friendlyMatch', `invite ${room.toString()}`); return;
        } else {
          this.match.deleteRoom(room);
          client.emit('newEvent', { target: pseudo, type: 'info', content: `${invite} is not connected.` });
          client.emit('friendlyMatch', false);
        }
      }
      this.handleLogEvent(client, 'friendlyMatch', `invite ${room.toString()} : FAILURE`);
    });
  }

  @SubscribeMessage('isConnected')
  handleEventIsConnected(@ConnectedSocket() client: Socket, @MessageBody() pseudo: string): void {
    if (this.clients[pseudo]) {
      client.emit('isConnected', true);
    } else {
      client.emit('newEvent', { target: pseudo, type: 'info', content: `${pseudo} is not connected.` });
      client.emit('isConnected', false);
    }
  }

  @SubscribeMessage('joinFriendlyMatch')
  handleEventJoinFriendlyMatch(@ConnectedSocket() client: Socket, @MessageBody() data: { room: number, isAccepted: boolean }): void {
    this.getPseudoBySocket(client, (pseudo) => {
      if (!pseudo) return;
      if (data.isAccepted) {
        const isReady = this.match.join(data.room, client, pseudo);
        (!isReady) && (client.emit('newEvent', { target: pseudo, type: 'info', content: 'This invition is expired.' }));
        (isReady) && (this.match.getRoomById(data.room).players[0].client.emit('newEvent', { target: pseudo, type: 'info', content: `${pseudo} accepte your invite.` }));
        client.emit('joinFriendlyMatch', isReady);
        this.handleLogEvent(client, 'joinFriendlyMatch', `${data.room.toString()}`); return;
      } else {
        const room = this.match.getRoomById(data.room);
        const inviter = (room) && room.players[0];
        inviter?.client.emit('newEvent', { target: pseudo, type: 'info', content: `${pseudo} refuse your invite.` });
        this.match.deleteRoom(data.room);
      }
      this.handleLogEvent(client, 'joinFriendlyMatch', `${data.room.toString()}: FAILURE`);
    });
  }

  @SubscribeMessage('leave')
  handleEventLeave(@ConnectedSocket() client: Socket): void {
    const room = this.match.getRoom(client);
    if (room.id) {
      const player = room.players.find(c => c.client === client);
      const opponent = room.players.find(c => c.client !== client);
      opponent.client.emit('stop');
      opponent.client.emit('newEvent', { target: player.name, type: 'info', content: `${player.name} leave this room.` });
      this.match.remove(opponent.client);
    }
    this.match.remove(client);
    this.handleLogEvent(client, 'leave');
  }

  @SubscribeMessage('match')
  handleEventMatch(@ConnectedSocket() client: Socket) {
    this.match.getRoom(client).match();
    this.handleLogEvent(client, 'match');
  }

  @SubscribeMessage('move')
  handleEventMove(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { key: Paddle['key'] & { ulti: boolean; power: boolean } },
  ): void {
    this.match.getRoom(client).move(client, data.key);
    // this.handleLogEvent(client, 'move', data);
  }

  @SubscribeMessage('players')
  handleEventPlayers(@ConnectedSocket() client: Socket): void {
    this.match.getRoom(client).player(client);
    // this.handleLogEvent(client, 'players');
  }

  @SubscribeMessage('restart')
  handleEventRestart(@ConnectedSocket() client: Socket): void {
    this.match.getRoom(client).restart();
    this.match.merge();
    this.handleLogEvent(client, 'restart');
  }

  @SubscribeMessage('start')
  handleEventStart(@ConnectedSocket() client: Socket) {
    this.match.getRoom(client).start(client);
    this.handleLogEvent(client, 'start');
  }

  @SubscribeMessage('play')
  handleEventPlay(@ConnectedSocket() client: Socket) {
    this.match.getRoom(client).play(client);
    this.handleLogEvent(client, 'play');
  }

  @SubscribeMessage('maps')
  handleEventMaps(@ConnectedSocket() client: Socket) {
    this.match.getRoom(client).maps(client);
    // this.handleLogEvent(client, 'maps');
  }

  @SubscribeMessage('score')
  async handleEventScore(@ConnectedSocket() client: Socket, @MessageBody() data: ScoreData) {

    await this.GameService.createFinalMatch(data.playerAPseudo, data.playerBPseudo, data.scoreA, data.scoreB);
    this.handleLogEvent(client, 'score', `${data.playerAPseudo} ${data.scoreA}:${data.scoreB} ${data.playerBPseudo}`);
  }
}