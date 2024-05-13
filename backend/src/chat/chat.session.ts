import { Injectable } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import {FriendsService} from '../friends/friends.service'
import { SocketGateway } from 'src/socket/socket.gateway';
import e from 'express';
import { UserStatus } from '@prisma/client';

export interface IGatewaySessionManager {
  getUserSocket(id: number): any; // Utilisez le type approprié pour le socket
  setUserSocket(token: string, socket: any): void; // Utilisez le type approprié pour le socket
  removeUserSocket(token: string): void;
  getSockets(): Map<number, any>; // Utilisez le type approprié pour le socket
}

@Injectable()
export class GatewaySessionManager {

  constructor(
    private FriendService: FriendsService,
    private readonly io: SocketGateway,
    ) {}
  private readonly sessions: Map<number, any> = new Map();


  
  getUserSocket(id: number) {
    return this.sessions.get(id);
  }

  setUserSocket(token: string, id: any) {
    try {

      const decoded = verify(token, process.env.JWT_SECRET)
      const userId = decoded.sub;
      const numberUserId = Number(userId);
      if (!this.sessions.has(numberUserId)) {
        this.sessions.set(numberUserId, id);
        this.FriendService.setStatus(numberUserId, 'ONLINE');
        this.io.handleUpdateConnection(this.sessions);
      }
      // console.log("Connected User list: ", this.sessions);
    } catch (error) {
      console.log("Error setUser sock: ", error);
    }
  }

  setInGameStatus(token: string, status: UserStatus) {
    try {
      const decoded = verify(token, process.env.JWT_SECRET)
      const userId = decoded.sub;
      const numberUserId = Number(userId);
      if (this.sessions.has(numberUserId)) {
        this.FriendService.setStatus(numberUserId, status);
        this.io.handleUpdateConnection(this.sessions);
      }
    } catch (error) {
      console.log("Error setInGame sock: ", error);
    }
  }


  removeUserSocket(token: string, id: any) {
    try {
    if (token && token !== 'null') {
        const decoded = verify(token, process.env.JWT_SECRET)
        const userId = decoded.sub;
        const numberUserId = Number(userId);
        this.sessions.delete(numberUserId);
        this.FriendService.setStatus(numberUserId, 'OFFLINE');
        this.io.handleUpdateConnection(this.sessions);
      } else {

        let userId = null;
        for (const [key, val] of this.sessions.entries()) {
          if (val === id) {
            userId = key;
            break ;
          }
        }
        if (userId) {
          this.sessions.delete(userId);
          this.io.handleUpdateConnection(this.sessions);
        }
        // console.log("After disconnect User list: ", this.sessions);
      }
    } catch (error) {
      console.log("Error removeUserSocket: ", error);
      //throw new Error('Problem remove User Socket');
    }
  }

  /*
  removeUserSocket(userId: number) {
    this.FriendService.setOnlineStatus(userId, false);
    this.sessions.delete(userId);
  }*/

  getSockets(): Map<number, any> { // Utilisez le type approprié pour le socket
    return this.sessions;
  }
}
