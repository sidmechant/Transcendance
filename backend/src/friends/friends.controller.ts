import { FriendsService } from './friends.service';
import { Channel, Friend, Player, User, UserStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport'; // Importez le middleware d'authentification si vous l'utilisez
import { Controller, Post, Patch, Get, Query, Req, Body, HttpException, HttpStatus, UseGuards, Param } from '@nestjs/common';
import { BadRequestException, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlayersService } from 'src/players/players.service';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { SendFriendRequestDto, FriendRequestIdDto, BlockDto } from './friends.dto'
import { EventEmitter2 } from '@nestjs/event-emitter';



@Controller('friends') // Remplacez 'friends' par le chemin approprié pour vos routes
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly playersService: PlayersService,
    private readonly eventEmitter: EventEmitter2, // Injectez PlayerService
  ) { }


  @UseGuards(JwtAuthGuard)
  @Post('/friend-request')
  async sendFriendRequest(@Req() req, @Body() dto: { receiverPseudo: string }): Promise<any> {
    try {
      const senderId = Number(req.userId);
      const receiver = await this.playersService.getPlayerByPseudo(dto.receiverPseudo); // Supposons que vous ayez une telle méthode
      if (!receiver) {
        // throw new HttpException("Joueur non trouvé.", HttpStatus.NOT_FOUND);
      }

      if (await this.friendsService.isBlockedByUser(senderId, receiver.id)) {
        // throw new HttpException("Vous avez été bloqué par cet utilisateur.", HttpStatus.FORBIDDEN);
      }

      const { receiverPseudo } = dto;
      const friendRequest = await this.friendsService.sendFriendRequest(senderId, receiverPseudo);
      this.eventEmitter.emit('friendrequest.create', friendRequest); // Émettez l'événement ici 
      return friendRequest;

    } catch (error) {
      if (error instanceof HttpException)
        return; /*throw error;*/
      // throw new HttpException("Une erreur s'est produite lors de l'envoi de la demande d'ami.", HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocklist')
  async getBlocklist(@Req() req): Promise<number[]> {

    const myId = Number(req.userId);
    return await this.friendsService.blocklist(myId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/friend-request/accept')
  async acceptFriendRequest(@Req() req, @Body() dto: { requesterId: number }): Promise<any> {
    try {
      const userId = Number(req.userId);
      const { requesterId } = dto;
      const friend = await this.friendsService.acceptFriendRequest(userId, requesterId);
      this.eventEmitter.emit('friendrequest.accept', friend); // Émettez l'événement ici
      return friend;
    } catch (error) {
      if (error instanceof HttpException) /*throw error;*/
        return;
      // throw new HttpException("Une erreur s'est produite lors de l'acceptation de la demande d'ami.", HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
   @Get('allWithStatus')
   async getAllPlayers(@Req() req): Promise<any> {
     try {
      const myId = Number(req.userId);
       const players = await this.playersService.getAllPlayers();
       const blockedByMe = await this.friendsService.getBlockedUsers(myId);
       const blockedMe = await this.friendsService.getBlockerUsers(myId);

       let goodPlayers = players.filter(player => 
        !blockedMe.some(blockedPlayer => blockedPlayer.id === player.id)
      );

      goodPlayers = goodPlayers.filter(player => player.id !== myId && player.id !== 0);
  
      // Ajouter le champ 'blocked' à chaque joueur.
      goodPlayers = goodPlayers.map(player => {
        const isBlocked = blockedByMe.some(blockedUser => blockedUser.id === player.id);
        return {
          ...player, // On conserve les propriétés existantes de l'objet joueur.
          blocked: isBlocked, // On ajoute la nouvelle propriété 'blocked'.
        };
      });

  
      // Retourner la liste modifiée des joueurs.
      return goodPlayers;
     } catch (error) {
       throw new HttpException("Une erreur s'est produite lors de la récupération de tous les joueurs.", HttpStatus.BAD_REQUEST);
     }
   }

  @UseGuards(JwtAuthGuard)
  @Patch('/friend-request/decline')
  async declineFriendRequest(@Req() req, @Body() dto: { requesterId: number }): Promise<any> {
    try {
      const userId = Number(req.userId);
      const { requesterId } = dto;
      const friend = await this.friendsService.declineFriendRequest(userId, requesterId);
      this.eventEmitter.emit('friendrequest.reject', friend); // Émettez l'événement ici
      return friend;

    } catch (error) {
      if (error instanceof HttpException) /*throw error;*/
        return;
      // throw new HttpException("Une erreur s'est produite lors du refus de la demande d'ami.", HttpStatus.BAD_REQUEST);
    }
  }


  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('search-pseudo')
  async searchPseudo(@Req() req, @Query('pseudo') pseudoToSearch: string): Promise<Player | null> {
    try {
      const searcherId = Number(req.userId);
      const playerWithPseudo = await this.playersService.getPlayerByPseudo(pseudoToSearch);

      if (!playerWithPseudo) {
        return;
        // throw new HttpException('Pseudo non trouvé.', HttpStatus.NOT_FOUND);
      }

      // Vérifiez si l'utilisateur actuel est bloqué par l'utilisateur dont le pseudo a été recherché
      if (await this.friendsService.isBlockedByUser(searcherId, playerWithPseudo.userId)) {
        return;
        // throw new HttpException("Vous avez été bloqué par cet utilisateur.", HttpStatus.FORBIDDEN);
      }

      return playerWithPseudo;
    } catch (error) {
      if (error instanceof HttpException) /*throw error;*/
        return;
    }
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('friends')
  async getFriends(@Req() req): Promise<Friend[]> {
    try {
      const userId = Number(req.userId);
      return await this.friendsService.getFriends(userId);
    } catch (error) {
      if (error instanceof HttpException) /*throw error;*/
        // throw new HttpException("Une erreur s'est produite lors de la récupération de la liste d'amis.", HttpStatus.BAD_REQUEST);
        return;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('isBlock/:senderId')
  async isBlock(@Req() req, @Param('senderId') senderId: string): Promise<boolean> {

    const myId = Number(req.userId);
    const id = Number(senderId);

    const block = await this.friendsService.isBlock(myId, id);

    return block;
  } 

  @UseGuards(JwtAuthGuard)
  @Get('users-online')
  async getUsersOnline(): Promise<User[]> {
    try {
      return await this.friendsService.getUsersOnline();
    } catch (error) {
      // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
      return;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('delete')
  async deleteFriend(@Req() req, @Body() target: FriendRequestIdDto): Promise<Friend> {

    console.log("chacal id: ", target.requesterId);
    const id: number = target.requesterId;
    return await this.friendsService.deleteFriend(id, Number(req.userId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends-online')
  async getFriendsOnline(@Req() req): Promise<User[]> {
    try {
      const userId = Number(req.user.id); // Si JwtAuthGuard attache les détails de l'utilisateur à `req.user`

      const friendsOnline = await this.friendsService.getFriendsOnline(userId);

      // Émettez l'événement pour notifier d'autres parties du système que l'utilisateur a demandé la liste des amis en ligne
      this.eventEmitter.emit('friends.online.list', { userId });

      return friendsOnline; // Renvoyer la liste des amis en ligne à l'appelant
    } catch (error) {
      return;
      //   throw new HttpException("Une erreur s'est produite lors de la récupération des amis en ligne.", HttpStatus.BAD_REQUEST);
    }
  }

  @Get('friendlist')
  @UseGuards(JwtAuthGuard)
  async getFriendlist(@Req() req) {
    try {
      const userId = Number(req.userId);

      const pendingFriends = await this.friendsService.getPendingFriends(userId);
      const acceptedFriends = await this.friendsService.getAcceptedFriends(userId);

      //console.log("pend: ", pendingFriends);
      //console.log("acc : ", acceptedFriends);
      const allFriends = [
        ...pendingFriends.map(friend => ({ ...friend, status: 'requested' })),
        ...acceptedFriends.map(friend => ({ ...friend, status: 'accepted' }))
      ];

      /*const enrichedFriends = await Promise.all(allFriends.map(async (friend: any) => {
        const id = friend.id;
        const player = await this.playersService.getPlayerById(id);
        return {
          ...friend,
          player,
        };
      }));
      */
      return allFriends;
      //return enrichedFriends;

    } catch (error) {
      return;
    }
  }

  @Get('channelInviteList/:channelId')
  async getInviteList(@Req() req, @Param('channelId') channelId: string) {

    const myId = req.userId;
    return await this.friendsService.getInviteList(channelId, Number(myId));
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)  // Gardez cette ligne si vous utilisez un garde d'authentification
  async getPendingFriends(@Req() req) {
    try {
      const userId = Number(req.userId); // Convertir l'ID de l'utilisateur en nombre

      // Récupérer la liste des amis en attente
      const pendingFriends = await this.friendsService.getPendingFriends(userId);

      // Émettre un événement pour informer d'autres parties du système que l'utilisateur a demandé la liste des amis en attente
      this.eventEmitter.emit('friends.pending.list', { userId });

      // Retourner la liste des amis en attente à l'appelant
      return pendingFriends;
    } catch (error) {
      // En cas d'erreur, lancez une exception avec un message approprié
      //   throw new HttpException("Une erreur s'est produite lors de la récupération des amis en attente.", HttpStatus.BAD_REQUEST);
      return;
    }
  }

  @Get('accepted')
  @UseGuards(JwtAuthGuard)  // Supprimez cette ligne si vous n'utilisez pas de garde d'authentification
  async getAcceptedFriends(@Req() req) {
    const id = req.userId; // Assurez-vous que req est correctement défini
    const userId = Number(req.userId);
    const acceptedFriends = await this.friendsService.getAcceptedFriends(userId);
    return acceptedFriends;
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  async getBlockedUsers(@Req() req): Promise<User[]> {
    const id = req.userId; // Assurez-vous que req est correctement défini
    const userId = Number(req.userId);// Cela dépend de la façon dont vous définissez l'ID de l'utilisateur connecté
    return await this.friendsService.getBlockedUsers(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('players-excluding-blocked-in-channel')
  async getPlayersExcludingBlockedAndSelfInChannel(@Req() req, @Body('channelId') channelId: string): Promise<Player[]> {
    try {
      const currentPlayerId = Number(req.userId); // Supposons que userId soit l'ID du joueur actuel

      const players = await this.friendsService.getPlayersExcludingBlockedAndSelfInChannel(
        currentPlayerId,
        channelId,
      );
      return players;
    } catch (error) {
      // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
      throw new HttpException("Une erreur s'est produite lors de la récupération des joueurs", HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('players-excluding-blocked-and-self')
  async getAllPlayersExcludingBlockedAndSelf(@Req() req): Promise<Player[]> {
    try {
      const currentPlayerId = Number(req.userId);

      const players = await this.friendsService.getAllPlayersExcludingBlockedAndSelf(currentPlayerId);

      console.log("test: ", players);
      if (!players || players.length === 0) {
        return [];
      }

      return players;
    } catch (error) {
      return;
    }
  }

  @Get('channels-user-is-not-in')
  @UseGuards(JwtAuthGuard)
  async getChannelsUserIsNotIn(@Req() req): Promise<Channel[]> {
    try {
      const userId = Number(req.userId); // Supposons que userId soit l'ID de l'utilisateur actuel
      return await this.friendsService.getChannelsUserIsNotIn(userId);
    } catch (error) {
      // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
      throw new HttpException("Une erreur s'est produite lors de la récupération des canaux.", HttpStatus.BAD_REQUEST);
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('block-user/:receiverId')
  async blockUser(@Req() req, @Param('receiverId') receiverId: string): Promise<any> { // changed return type to 'any' for more flexibility
    try {

      console.log("block user");
      const userId = Number(req.userId); // ensure user ID is correctly attached to the request
      const rId = Number(receiverId);
      // Fetch the user to block using the provided pseudonym

      const res = await this.friendsService.blockUser(userId, rId);

      console.log("after block: ", res);

      return { message: 'Utilisateur bloqué avec succès' }; 
    } catch (error) {
      console.log("probleme block: ", error);
     return ;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('unblock-user/:receiverId')
  async unblockUser(@Req() req, @Param('receiverId') receiverId: string): Promise<any> { // changed return type to 'any' for more flexibility
    try {

      console.log("block user");
      const userId = Number(req.userId); // ensure user ID is correctly attached to the request
      const rId = Number(receiverId);
      // Fetch the user to block using the provided pseudonym

      const res = await this.friendsService.unblockUser(userId, rId);

      console.log("after unblock: ", res);

      return { message: 'Utilisateur bloqué avec succès' }; 
    } catch (error) {
      console.log("probleme block: ", error);
     return ;
    }
  }

}