import { Injectable, NotFoundException, ConflictException, BadRequestException , ForbiddenException} from '@nestjs/common';
import { Player, Match, User, Friend, UserStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService,
    private readonly crudService: CrudService)

  {}

  /**
   * Récupère un joueur par son ID.
   * @param id - L'ID du joueur à rechercher.
   * @returns Le joueur trouvé.
   * @throws NotFoundException si le joueur n'est pas trouvé.
   */
  async getPlayerById(id: number): Promise<Player> {
    try {
      const player = await this.prisma.player.findUnique({
        where: { id },
      });
      if (!player) {
        throw new NotFoundException(`Joueur avec l'ID ${id} introuvable`);
      }
      return player;
    } catch (error) {
      console.error('Erreur lors de la récupération du joueur par ID', error);
      throw new NotFoundException("Une erreur s'est produite lors de la récupération du joueur par ID.");
    }
  }
  async findUserById(id: number): Promise<User | null> {
    return this.crudService.findUserById(id);
  }                                                                                                                                                                                                                                      


  /**
   * Met à jour l'URL de la photo de profil d'un joueur.
   * @param id - L'ID du joueur à mettre à jour.
   * @param urlPhotoProfile - La nouvelle URL de la photo de profil.
   * @returns Le joueur mis à jour.
   * @throws NotFoundException si le joueur n'est pas trouvé.
   */
  async setPlayerUrlPhotoProfile(id: number, urlPhotoProfile: string): Promise<Player> {
    try {
      const updatedPlayer = await this.prisma.player.update({
        where: { id },
        data: { urlPhotoProfile },
      });
      if (!updatedPlayer) {
        throw new NotFoundException(`Joueur avec l'ID ${id} introuvable`);
      }
      return updatedPlayer;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'URL de la photo du joueur", error);
      throw new NotFoundException("Une erreur s'est produite lors de la mise à jour de l'URL de la photo du joueur.");
    }
  }

  /**
   * Met à jour le pseudo d'un joueur.
   * @param id - L'ID du joueur à mettre à jour.
   * @param pseudo - Le nouveau pseudo du joueur.
   * @returns Le joueur mis à jour.
   * @throws NotFoundException si le joueur n'est pas trouvé.
   */
  async setPlayerPseudo(id: number, pseudo: string): Promise<Player> {
    try {
      const updatedPlayer = await this.prisma.player.update({
        where: { id },
        data: { pseudo },
      });
      if (!updatedPlayer) {
        throw new NotFoundException(`Joueur avec l'ID ${id} introuvable`);
      }
      console.log("Hello_Hello", pseudo);

      return updatedPlayer;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du pseudo du joueur", error);
      throw new NotFoundException("Une erreur s'est produite lors de la mise à jour du pseudo du joueur.");
    }
  }

  /**
   * Récupère tous les matches associés à un joueur par son ID.
   * @param id - L'ID du joueur.
   * @returns Un tableau de tous les matches joués par le joueur.
   * @throws NotFoundException si le joueur n'est pas trouvé.
   */
  async getAllMatchesByPlayerId(id: number): Promise<Match[]> {
    try {
      const player = await this.prisma.player.findUnique({
        where: { id },
        include: {
          matchesA: true,
          matchesB: true,
        },
      });
      if (!player) {
        throw new NotFoundException(`Joueur avec l'ID ${id} introuvable`);
      }
      const matchesA = player.matchesA || [];
      const matchesB = player.matchesB || [];
      const matches = [...matchesA, ...matchesB];
      return matches;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les matches joués par le joueur', error);
      throw new NotFoundException("Une erreur s'est produite lors de la récupération de tous les matches joués par le joueur.");
    }
  }

  /**
   * Récupère tous les joueurs.
   * @returns Un tableau de tous les joueurs.
   * @throws NotFoundException si une erreur se produit lors de la récupération des joueurs.
   */
  async getAllPlayers(): Promise<Player[]> {
    try {
      const players = await this.prisma.player.findMany({
        include: {
          user: {
            select: {
              status: true
            }
          }
        }
      });
      return players;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les joueurs', error);
      throw new NotFoundException("Une erreur s'est produite lors de la récupération de tous les joueurs.");
    }
  }



  /**
   * Supprime un joueur par son ID.
   * @param playerId - L'ID du joueur à supprimer.
   * @returns Le joueur supprimé.
   * @throws NotFoundException si le joueur n'est pas trouvé.
   */
  async deletePlayer(playerId: number): Promise<Player> {
    try {
      const deletedPlayer = await this.prisma.player.delete({
        where: { id: playerId },
      });
      if (!deletedPlayer) {
        throw new NotFoundException(`Joueur avec l'ID ${playerId} introuvable`);
      }
      return deletedPlayer;
    } catch (error) {
      console.error("Erreur lors de la suppression du joueur", error);
      throw new NotFoundException("Une erreur s'est produite lors de la suppression du joueur.");
    }
  }

  /**
   * Ajoute l'ID d'un match au tableau de matches d'un joueur.
   * @param playerId - L'ID du joueur.
   * @param matchId - L'ID du match à ajouter.
   * @returns Le joueur mis à jour avec le match ajouté.
   * @throws {NotFoundException} Si le joueur n'est pas trouvé.
   * @throws {NotFoundException} Si une erreur survient lors de la mise à jour du joueur.
   */
  async addMatchToPlayerA(playerId: number, matchId: number): Promise<Player> {
    try {
      const existingPlayer = await this.getPlayerById(playerId);
      const updatedPlayer = await this.prisma.player.update({
        where: { id: playerId },
        data: {
          matchesA: {
            connect: [{ id: matchId }],
          },
        },
      });
      return updatedPlayer;
    } catch (error) {
      console.error("Erreur lors de l'ajout du match au joueur", error);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new NotFoundException("Une erreur s'est produite lors de la mise à jour du joueur.");
      }
    }
  }

  async addMatchToPlayerB(playerId: number, matchId: number): Promise<Player> {
    try {
      const existingPlayer = await this.getPlayerById(playerId);
      const updatedPlayer = await this.prisma.player.update({
        where: { id: playerId },
        data: {
          matchesB: {
            connect: [{ id: matchId }],
          },
        },
      });

      // console.log("ADD Match to : ", existingPlayer.pseudo);
      // console.log("Updated: ", updatedPlayer);
      return updatedPlayer;
    } catch (error) {
      console.error("Erreur lors de l'ajout du match au joueur", error);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new NotFoundException("Une erreur s'est produite lors de la mise à jour du joueur.");
      }
    }
  }
  async isPseudoUnique(pseudo: string, id: number): Promise<boolean> {
    const existingPlayer = await this.prisma.player.findFirst({
      where: { 
        pseudo,
        NOT: { id }
      }
    });
    return !existingPlayer;
  }


  async getPlayerByPseudo(pseudo: string): Promise<Player> {
    try {
        const player = await this.prisma.player.findFirst({
            where: { pseudo },
            include: { user: true }, // inclure l'objet user dans la réponse si nécessaire
        });

        if (!player) {
            throw new NotFoundException(`Joueur avec le pseudo ${pseudo} introuvable`);
        }

        return player;
    } catch (error) {
        console.error('Erreur lors de la récupération du joueur par pseudo', error);
        throw new NotFoundException("Une erreur s'est produite lors de la récupération du joueur par pseudo.");
    }
}

async getPhotoUrlById(id: number): Promise<{ urlPhotoProfile: string; }> {
  try {
      const player = await this.prisma.player.findUnique({
          where: { id },
          select: { urlPhotoProfile: true }
      });

      if (!player) {
          throw new NotFoundException(`Joueur avec l'ID ${id} introuvable`);
      }

      return player;
  } catch (error) {
      console.error("Erreur lors de la récupération de l'URL de la photo du joueur", error);
      throw new NotFoundException("Une erreur s'est produite lors de la récupération de l'URL de la photo du joueur.");
  }
}


async checkProfileUpdated(userId: number): Promise<boolean> {
  try {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { player: true },
    });

    if (!user) {
      return false;
    }

    
    const hasPseudo = !!user.player?.pseudo;
    const hasUrlPhotoProfile = !!user.player?.urlPhotoProfile;

    if (hasPseudo && hasUrlPhotoProfile) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isProfileUpdated: true,
          role: 'USER',
        },
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification de la mise à jour du profil", error);
    throw new NotFoundException("Une erreur s'est produite lors de la vérification de la mise à jour du profil.");
  }
}


/**
 * Vérifie si l'authentification à deux facteurs est activée pour un utilisateur donné.
 * @param userId - L'ID de l'utilisateur à vérifier.
 * @returns `true` si l'authentification à deux facteurs est activée, `false` sinon.
 * @throws NotFoundException si l'utilisateur n'est pas trouvé ou si une autre erreur survient.
 */
async isTwoFactorAuthenticationEnabled(userId: number): Promise<boolean> {
  try {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTwoFactorAuthenticationEnabled: true }
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable`);
    }

    return user.isTwoFactorAuthenticationEnabled;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification à deux facteurs", error);
    throw new NotFoundException("Une erreur s'est produite lors de la vérification de l'authentification à deux facteurs.");
  }
}


//////////////////////////////////////////FRIEND FRIEND FRIEND////////////////////////////////////////////

async sendFriendRequest(senderId: number, receiverPseudo: string): Promise<Friend> {
  // 1. Vérifier si le Player avec ce pseudo existe
  const receiverPlayer = await this.prisma.player.findFirst({ where: { pseudo: receiverPseudo } });

  if (!receiverPlayer) {
    throw new NotFoundException(`Joueur avec le pseudo ${receiverPseudo} introuvable`);
  }

  // Obtenir l'identifiant de l'utilisateur associé au Player
  const receiverUserId = receiverPlayer.userId;

  // Vérifier si une demande a déjà été envoyée ou existe
  const existingRequest = await this.prisma.friend.findFirst({
    where: { userId: senderId, friendId: receiverUserId }
  });

  if (existingRequest) {
    throw new BadRequestException('Une demande a déjà été envoyée ou existe déjà entre ces deux utilisateurs.');
  }

  // 2. Vérifier si l'utilisateur destinataire a bloqué l'utilisateur expéditeur
  const blockedFriendship = await this.prisma.friend.findFirst({ 
    where: { 
      userId: receiverUserId, 
      friendId: senderId, 
      status: 'blocked'
    } 
  });

  if (blockedFriendship) {
    throw new ForbiddenException('You have been blocked by this user');
  }

  return this.prisma.friend.create({
    data: {
      userId: senderId,
      friendId: receiverUserId,
      status: 'requested'
    }
  });
}


async acceptFriendRequest(userId: number, requesterId: number): Promise<Friend> {
  // 1. Trouver la demande d'ami qui a été envoyée au destinataire (userId) par l'expéditeur (requesterId) avec le statut 'requested'
  const friendRequest = await this.prisma.friend.findFirst({
    where: { userId: requesterId, friendId: userId, status: 'requested' }
  });

  // 2. Si la demande n'existe pas, générer une erreur
  if (!friendRequest) {
    throw new NotFoundException('Demande d\'ami non trouvée ou déjà traitée.');
  }

  // 3. Si la demande existe, mettre à jour son statut à 'accepted'
  return this.prisma.friend.update({
    where: { id: friendRequest.id },
    data: { status: 'accepted' }
  });
}

async declineFriendRequest(userId: number, requesterId: number): Promise<Friend> {
  // 1. Trouver la demande d'ami qui a été envoyée au destinataire (userId) par l'expéditeur (requesterId) avec le statut 'requested'
  const friendRequest = await this.prisma.friend.findFirst({
    where: { userId: requesterId, friendId: userId, status: 'requested' }
  });

  // 2. Si la demande n'existe pas, générer une erreur
  if (!friendRequest) {
    throw new NotFoundException('Demande d\'ami non trouvée ou déjà traitée.');
  }

  // 3. Si la demande existe, mettre à jour son statut à 'declined'
  return this.prisma.friend.update({
    where: { id: friendRequest.id },
    data: { status: 'declined' }
  });
}
async isBlockedByUser(senderId: number, receiverId: number): Promise<boolean> {
  try {
    // Récupérez l'enregistrement Friend correspondant au couple senderId et receiverId.
    const friendship = await this.prisma.friend.findFirst({
      where: {
        userId: senderId,
        friendId: receiverId,
      },
    });

    // Si la relation existe et que le statut est "blocked", retournez true.
    if (friendship?.status === 'blocked') {
      return true;
    }

    // Sinon, retournez false.
    return false;
  } catch (error) {
    // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
    throw new Error('Une erreur s\'est produite lors de la vérification du blocage de l\'utilisateur.');
  }
}


async blockUser(userId: number, friendId: number): Promise<void> {
  try {
    // Recherchez la relation Friend en utilisant l'ID de la relation.
    const friendRelation = await this.prisma.friend.findUnique({
      where: {
        id: userId, // Utilisez l'ID de la relation Friend
      },
    });

    // Mettez à jour le statut de la relation pour le bloquer.
    if (friendRelation) {
      await this.prisma.friend.update({
        where: {
          id: friendRelation.id,
        },
        data: {
          status: 'blocked',
        },
      });
    }
  } catch (error) {
    // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
    throw new Error('Une erreur s\'est produite lors du blocage de l\'utilisateur.');
  }
}


async updateUserStatus(userId: number, status: UserStatus): Promise<User> {
  try {
    // Mettez à jour le statut de l'utilisateur.
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status: status,
      },
    });
    return updatedUser;
  } catch (error) {
    // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
    throw new Error('Une erreur s\'est produite lors de la mise à jour du statut de l\'utilisateur.');
  }
}

async getUserStatus(userId: number): Promise<UserStatus> {
  try {
    // Récupérez le statut de l'utilisateur.
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      return user.status;
    } else {
      throw new Error('Utilisateur non trouvé.');
    }
  } catch (error) {
    // Gérez les erreurs ici, par exemple, en lançant une exception ou en journalisant.
    throw new Error('Une erreur s\'est produite lors de la récupération du statut de l\'utilisateur.');
  }
}

async  getFriendsOfUser(userId: number) {
  const requestedFriends = await this.prisma.friend.findMany({
      where: {
          userId: userId,
          status: "accepted"
      },
      select: {
          friend: true
      }
  });

  const receivedFriends = await this.prisma.friend.findMany({
      where: {
          friendId: userId,
          status: "accepted"
      },
      select: {
          user: true
      }
  });

  const friends = [
      ...requestedFriends.map(f => f.friend),
      ...receivedFriends.map(f => f.user)
  ];

  return friends;
}
// /////////////////////////////////////////////////////STATUS STATUS OFFLINE ONLINE////////////////////////////////////////////////////////////////

async  getUsersOnline() {
  return await this.prisma.user.findMany({
      where: {
          status: "ONLINE"
      }
  });
}
}
