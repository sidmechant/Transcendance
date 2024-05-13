import { Controller, Get, Body,
  Post,  Patch, Req, Param, Delete, HttpException, HttpStatus, UseGuards, Query } from '@nestjs/common';
 import { PlayersService } from './players.service';
 import { Player } from '@prisma/client';
 import { JwtAuthGuard } from  '../auth/jwt.guard';
 import { UpdatePhotoDto, UpdatePseudoDto, PseudoDto,SendFriendRequestDto,  FriendRequestIdDto, FromTokenDto} from './players.dto'
 import { validate } from 'class-validator';
 import { BadRequestException, NotFoundException,  ParseIntPipe } from '@nestjs/common';
 import { use } from 'passport';
 import { verify } from 'jsonwebtoken';

 
 @Controller('players')
 export class PlayersController {
   constructor(private readonly playersService: PlayersService) {}
 
   /**
    * Récupère un joueur par son ID.
    * @param req - La requête HTTP contenant l'ID du joueur dans req.userId.
    * @returns Le joueur trouvé.
    */

   @UseGuards(JwtAuthGuard)
   @Get('')
   async getPlayerbyId(@Req() req): Promise<{ player: Player, role: string, isProfileUpdated: boolean,  isTwoFactorAuthEnabled: boolean  }> {
     
     try {
 
      //  console.log("TRYING TO GET REQ.ID");
       const id: number = Number(req.userId);
 
      //  console.log("GOT THE ID: ", id);
       // Utilisez la fonction getPlayerById du service pour récupérer le joueur par ID
       const player = await this.playersService.getPlayerById(id);
 
      //  console.log("GETTING PLAYER");
       if (!player) {
         throw new HttpException("Le player n'a pas été trouvé.", HttpStatus.NOT_FOUND);
       }
       const user = await this.playersService.findUserById(id);
 
       if(!user) {
         throw new HttpException("L'utilisateur n'a pas ete trouve", HttpStatus.NOT_FOUND);
       }
 
       const isProfileUpdated = await this.playersService.checkProfileUpdated(id);
 
       const isTwoFactorAuthEnabled = await this.playersService.isTwoFactorAuthenticationEnabled(id);
 
       return {
         player: player,
         role: user.role,
         isProfileUpdated: isProfileUpdated,
         isTwoFactorAuthEnabled: isTwoFactorAuthEnabled
       };
     } catch (error) {
       console.error("PROBLEME");
       //console.error("Une erreur s'est produite lors de la récupération des détails du joueur.", error);
       //throw new HttpException("Une erreur s'est produite lors de la récupération des détails du joueur.", HttpStatus.BAD_REQUEST);
     }
   }
   // async getPlayerById(@Req() req): Promise<Player> {
   //   try {
   //     const id: number = Number(req.userId);
   //     const player = await this.playersService.getPlayerById(id);
   //     return player;
   //   } catch (error) {
   //     throw new HttpException('Une erreur s\'est produite lors de la récupération du joueur par ID.', HttpStatus.BAD_REQUEST);
   //   }
   // }

   @UseGuards(JwtAuthGuard)
   @Get('FromToken:token')
   async getPlayerFromToken(@Param() payload: FromTokenDto): Promise<Player> {

      try {
        const decoded = verify(payload.token, process.env.JWT_SECRET)
        const id = decoded.sub;
        
        const player = await this.playersService.getPlayerById(Number(id));

        if (!player) {
          throw new HttpException("Le player n'a pas été trouvé.", HttpStatus.NOT_FOUND);
        }
        return player;
      } catch (error) {
        console.error("Error getting player from token: ", error);
      }
   }
 
 
 @UseGuards(JwtAuthGuard)
 @Get('photo')
 async getPhotoUrl(@Req() req): Promise<{ urlPhotoProfile: string; }> {
     try {
         const id: number = Number(req.userId);
         const photourl = await this.playersService.getPhotoUrlById(id);
         return photourl;
     } catch (error) {
         if (error instanceof HttpException) throw error; // Si l'erreur est déjà une HttpException, la relancer telle quelle
         throw new HttpException("Une erreur s'est produite lors de la récupération de l'URL de la photo du joueur.", HttpStatus.BAD_REQUEST);
     }
 }
 
   /**
    * Met à jour l'URL de la photo de profil d'un joueur.
    * @param req - La requête HTTP contenant l'ID du joueur dans req.userId.
    * @param urlPhotoProfile - La nouvelle URL de la photo de profil à mettre à jour.
    * {
    *    urlPhotoProfile: "http://url/blablabla"
    * }
    * @returns Le joueur mis à jour.
    */
   @UseGuards(JwtAuthGuard)
   @Patch('photo')
   async setPlayerUrlPhotoProfile(@Req() req, @Body() updatePhotoDto: UpdatePhotoDto): Promise<{ updatedPlayer: Player, isProfileUpdated: boolean }> {
     try {
       const errors = await validate(updatePhotoDto); // Validez le DTO
       if (errors.length > 0) {
         const errorMessage = errors.map(error => Object.values(error.constraints)).join(', ');
         throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
       }
   
       const id: number = Number(req.userId);
       const updatedPlayer = await this.playersService.setPlayerUrlPhotoProfile(id, updatePhotoDto.urlPhotoProfile);
       const isProfileUpdated = await this.playersService.checkProfileUpdated(id);
 
       return { updatedPlayer, isProfileUpdated };
     } catch (error) {
       if (error instanceof HttpException) throw error; // Si l'erreur est déjà une HttpException, la relancer telle quelle
       throw new HttpException("Une erreur s'est produite lors de la mise à jour de l'URL de la photo du joueur.", HttpStatus.BAD_REQUEST);
     }
   }
   
   /**
    * Met à jour le pseudo d'un joueur.
    * @param req - La requête HTTP contenant l'ID du joueur dans req.userId.
    * @param pseudo - Le nouveau pseudo du joueur.
    * {
    *    pseudo: "moi"
    * }
    * @returns Le joueur mis à jour.
    */
   @UseGuards(JwtAuthGuard)
   @Patch('pseudo')
   async setPlayerPseudo(@Req() req, @Body() dto: UpdatePseudoDto): Promise< {pseudo: Player, isProfileUpdated: boolean}> {
     try {
       const errors = await validate(dto);
       if (errors.length > 0) {
         const errorMessage = errors.map(error => Object.values(error.constraints)).join(', ');
         throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
       }
   
       const id: number = Number(req.userId);
       
       // Vérifiez si le pseudo est unique
       if (!await this.playersService.isPseudoUnique(dto.pseudo, id)) {
         throw new HttpException('Le pseudo est déjà utilisé par un autre joueur.', HttpStatus.CONFLICT);
       }
       
       const pseudo =  await this.playersService.setPlayerPseudo(id, dto.pseudo);
       const isProfileUpdated = await this.playersService.checkProfileUpdated(id);
 
       return { pseudo, isProfileUpdated };
     } catch (error) {
       if (error instanceof HttpException) throw error;
       throw new HttpException('Une erreur inattendue s’est produite.', HttpStatus.BAD_REQUEST);
     }
   }
 
   /**
    * Récupère tous les matches associés à un joueur par son ID.
    * @param req - La requête HTTP contenant l'ID du joueur dans req.userId.
    * @returns Un tableau de tous les matches joués par le joueur.
    */
   @UseGuards(JwtAuthGuard)
   @Get('matches')
   async getAllMatchesByPlayerId(@Req() req): Promise<any> {
     try {
       const id: number = Number(req.userId);
       const matches = await this.playersService.getAllMatchesByPlayerId(id);
       return matches;
     } catch (error) {
       throw new HttpException("Une erreur s'est produite lors de la récupération de tous les matches joués par le joueur.", HttpStatus.BAD_REQUEST);
     }
   }
 
   /**
    * Récupère tous les joueurs.
    * @returns Un tableau de tous les joueurs.
    */
   @UseGuards(JwtAuthGuard)
   @Get('all')
   async getAllPlayers(@Req() req): Promise<Player[]> {
     console.log("getAllPlayers")
     try {
      const myId = Number(req.userId);
       const players = await this.playersService.getAllPlayers();

       const goodPlayers = players.filter((player) => player.id !== 0 && player.id !== myId);
       return goodPlayers;
     } catch (error) {
       throw new HttpException("Une erreur s'est produite lors de la récupération de tous les joueurs.", HttpStatus.BAD_REQUEST);
     }
   }
 
   /**
    * Supprime un joueur par son ID.
    * @param playerId - L'ID du joueur à supprimer.
    * @returns Le joueur supprimé.
    */
   @UseGuards(JwtAuthGuard)
   @Delete('deleted')
   async deletePlayer(@Req() req): Promise<Player> {
     try {
       const playerId: number = req.userId;
       const deletedPlayer = await this.playersService.deletePlayer(playerId);
       return deletedPlayer;
     } catch (error) {
       throw new HttpException("Une erreur s'est produite lors de la suppression du joueur.", HttpStatus.BAD_REQUEST);
     }
   }
   
   @UseGuards(JwtAuthGuard)
   @Get('byPseudo/:pseudo')
   async getUserByPseudo(@Param() params: PseudoDto): Promise<Player> {
     try {
       // Validez le pseudo (DTO)
       const errors = await validate(params);
       if (errors.length > 0) {
         const errorMessage = errors.map(error => Object.values(error.constraints)).join(', ');
         throw new BadRequestException(errorMessage);
       }
   
       const player = await this.playersService.getPlayerByPseudo(params.pseudo);
       
       if (!player) {
         throw new NotFoundException(`Joueur avec le pseudo ${params.pseudo} introuvable`);
       }
       
       return player;
     } catch (error) {
       if (error instanceof HttpException) {
         throw error;
       }
       // Si vous souhaitez toujours renvoyer un code d'état générique 500 pour d'autres erreurs, 
       // vous pouvez le garder. Sinon, ajustez-le selon vos besoins.
       throw new HttpException("Une erreur inattendue s'est produite.", HttpStatus.BAD_REQUEST);
     }
   }
 
 
   ///////////////////////////FRIEND FRIEND FRIEN/////////////////////////////////////////////////////////////////////////////////////////
 
 
 
   @UseGuards(JwtAuthGuard)
   @Post('/friend-request')
   async sendFriendRequest(@Req() req, @Body() dto: { receiverPseudo: string }): Promise<any> {
     try {
       const senderId = Number(req.userId);
       const receiver = await this.playersService.getPlayerByPseudo(dto.receiverPseudo); // Supposons que vous ayez une telle méthode
       if (!receiver) {
         throw new HttpException("Joueur non trouvé.", HttpStatus.NOT_FOUND);
       }
   
       if (await this.playersService.isBlockedByUser(senderId, receiver.id)) {
         throw new HttpException("Vous avez été bloqué par cet utilisateur.", HttpStatus.FORBIDDEN);
       }
   
       const { receiverPseudo } = dto;
       return await this.playersService.sendFriendRequest(senderId, receiverPseudo);
     } catch (error) {
       if (error instanceof HttpException) throw error;
       throw new HttpException("Une erreur s'est produite lors de l'envoi de la demande d'ami.", HttpStatus.BAD_REQUEST);
     }
   }
   
 
   // @UseGuards(JwtAuthGuard)
   // @Post('/friend-request')
   // async sendFriendRequest(@Req() req, @Body() dto: { receiverPseudo: string }): Promise<any> {
   //   try {
   //     const senderId = Number(req.userId);
   //     const { receiverPseudo } = dto;
   //     return await this.playersService.sendFriendRequest(senderId, receiverPseudo);
   //   } catch (error) {
   //     if (error instanceof HttpException) throw error;
   //     throw new HttpException("Une erreur s'est produite lors de l'envoi de la demande d'ami.", HttpStatus.BAD_REQUEST);
   //   }
   // }
 
   @UseGuards(JwtAuthGuard)
   @Patch('/friend-request/accept')
   async acceptFriendRequest(@Req() req, @Body() dto: { requesterId: number }): Promise<any> {
     try {
       const userId = Number(req.userId);
       const { requesterId } = dto;
       return await this.playersService.acceptFriendRequest(userId, requesterId);
     } catch (error) {
       if (error instanceof HttpException) throw error;
       throw new HttpException("Une erreur s'est produite lors de l'acceptation de la demande d'ami.", HttpStatus.BAD_REQUEST);
     }
   }
 
   @UseGuards(JwtAuthGuard)
   @Patch('/friend-request/decline')
   async declineFriendRequest(@Req() req, @Body() dto: { requesterId: number }): Promise<any> {
     try {
       const userId = Number(req.userId);
       const { requesterId } = dto;
       return await this.playersService.declineFriendRequest(userId, requesterId);
     } catch (error) {
       if (error instanceof HttpException) throw error;
       throw new HttpException("Une erreur s'est produite lors du refus de la demande d'ami.", HttpStatus.BAD_REQUEST);
     }
   }
 
   @UseGuards(JwtAuthGuard)
 @Get('search-pseudo')
 async searchPseudo(@Req() req, @Query('pseudo') pseudoToSearch: string): Promise<Player | null> {
     try {
         const searcherId = Number(req.userId);
         const playerWithPseudo = await this.playersService.getPlayerByPseudo(pseudoToSearch);
 
         if (!playerWithPseudo) {
             throw new HttpException('Pseudo non trouvé.', HttpStatus.NOT_FOUND);
         }
 
         // Vérifiez si l'utilisateur actuel est bloqué par l'utilisateur dont le pseudo a été recherché
         if (await this.playersService.isBlockedByUser(searcherId, playerWithPseudo.userId)) {
             throw new HttpException("Vous avez été bloqué par cet utilisateur.", HttpStatus.FORBIDDEN);
         }
 
         return playerWithPseudo;
     } catch (error) {
         if (error instanceof HttpException) throw error;
         throw new HttpException("Une erreur inattendue s’est produite.", HttpStatus.BAD_REQUEST);
     }
 }
 
 
 
 
 }
 