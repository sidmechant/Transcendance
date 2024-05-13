import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { Player, User, Friend, UserStatus, Prisma, Channel, $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) { }
  async getFriendsOfUser(userId: number) {
    const requestedFriends = await this.prisma.friend.findMany({
      where: { userId: userId, status: "accepted" },
      select: { friend: { include: { player: true } } }
    });

    const receivedFriends = await this.prisma.friend.findMany({
      where: { friendId: userId, status: "accepted" },
      select: { user: { include: { player: true } } }
    });

    const friends = [
      ...requestedFriends.map(f => f.friend),
      ...receivedFriends.map(f => f.user)
    ];

    return friends;
  }

  async findByPseudo(pseudo: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        username: pseudo,
      },
      include: {
        player: true,
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        player: true,
      },
    });
  }
  async getBlockedUsers(userId: number): Promise<any> {
    const blockedRelations = await this.prisma.friend.findMany({
      where: { userId: userId, status: 'blocked' },
      select: { friend: { include: { player: true } } }
    });
    return blockedRelations.map(relation => relation.friend);
  }

  async getBlockerUsers(userId: number): Promise<User[]> {
    const blockedRelations = await this.prisma.friend.findMany({
      where: { friendId: userId, status: 'blocked' },
      include: { user: true },
    });


    const blockerUsers = blockedRelations.map(relation => relation.user);

    return blockerUsers;

  }

  async getUsersOnline(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { status: "ONLINE" },
      include: { player: true }
    });
  }

  async getPendingFriends(userId: number) {
    const pendingRequests = await this.prisma.friend.findMany({
      where: { friendId: userId, status: "requested" },
      select: { user: { include: { player: true } } }
    });

    return pendingRequests.map(f => f.user);
  }

  async getFriends(userId: number): Promise<Friend[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        requestedFriends: {
          where: { status: 'accepted' },
          include: { friend: { include: { player: true } } },
        },
        receivedRequests: {
          where: { status: 'accepted' },
          include: { user: { include: { player: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    const requestedFriends = user.requestedFriends;
    const receivedFriends = user.receivedRequests;

    return [...requestedFriends, ...receivedFriends];
  }


  async getAcceptedFriends(userId: number): Promise<{ user: User, player: Player }[]> {
    const acceptedFriendships = await this.prisma.friend.findMany({
      where: {
        AND: [
          { status: 'accepted' },
          {
            OR: [
              { userId: userId },
              { friendId: userId }
            ]
          }
        ]
      },
      include: {
        user: {
          include: {
            player: true
          }
        },
        friend: {
          include: {
            player: true
          }
        }
      }
    });

    // Extraire la liste des amis acceptés et leurs pseudos associés
    const acceptedFriendsWithPseudo: { user: User, player: Player }[] = [];

    for (const friendship of acceptedFriendships) {
      if (friendship.userId === userId) {
        acceptedFriendsWithPseudo.push({ user: friendship.friend, player: friendship.friend.player });
      } else {
        acceptedFriendsWithPseudo.push({ user: friendship.user, player: friendship.user.player });
      }
    }

    return acceptedFriendsWithPseudo;
  }



  async getFriendsOnline(userId: number): Promise<User[]> {

    const userWithFriends = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        requestedFriends: {
          where: { status: 'accepted' },
          include: { friend: true }
        },
        receivedRequests: {
          where: { status: 'accepted' },
          include: { user: true }
        }
      }
    });

    if (!userWithFriends) {
      throw new Error("User not found");
    }

    const allFriends = [
      ...userWithFriends.requestedFriends.map(fr => fr.friend),
      ...userWithFriends.receivedRequests.map(fr => fr.user)
    ];

    // Filtrez la liste des amis pour ne conserver que ceux qui sont en ligne
    const onlineFriends = allFriends.filter(friend => friend.status === "ONLINE");

    return onlineFriends;
  }

  async sendFriendRequest(senderId: number, receiverPseudo: string): Promise<Friend> {
    const receiverPlayer = await this.prisma.player.findFirst({ where: { pseudo: receiverPseudo } });

    if (!receiverPlayer) {
      throw new NotFoundException(`Joueur avec le pseudo ${receiverPseudo} introuvable`);
    }

    const receiverUserId = receiverPlayer.userId;

    const existingRequest = await this.prisma.friend.findFirst({
      where: { userId: senderId, friendId: receiverUserId }
    });

    if (existingRequest) {
      throw new BadRequestException('Une demande a déjà été envoyée ou existe déjà entre ces deux utilisateurs.');
    }

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
    const friendRequest = await this.prisma.friend.findFirst({
      where: { userId: requesterId, friendId: userId, status: 'requested' }
    });

    if (!friendRequest) {
      throw new NotFoundException('Demande d\'ami non trouvée ou déjà traitée.');
    }

    return this.prisma.friend.update({
      where: { id: friendRequest.id },
      data: { status: 'accepted' }
    });
  }

  async declineFriendRequest(userId: number, requesterId: number): Promise<Friend> {
    const friendRequest = await this.prisma.friend.findFirst({
      where: { userId: requesterId, friendId: userId, status: 'requested' }
    });

    if (!friendRequest) {
      throw new NotFoundException('Demande d\'ami non trouvée ou déjà traitée.');
    }

    return await this.prisma.friend.delete({
      where: {
        id: friendRequest.id,
      }
    });
  }

  async isBlockedByUser(senderId: number, receiverId: number): Promise<boolean> {
    try {
      const friendship = await this.prisma.friend.findFirst({
        where: {
          userId: senderId,
          friendId: receiverId,
        },
      });

      if (friendship?.status === 'blocked') {
        return true;
      }

      return false;
    } catch (error) {
      throw new Error('Une erreur s\'est produite lors de la vérification du blocage de l\'utilisateur.');
    }
  }


  async resetStatus() {
    const users = await this.prisma.user.findMany();

    for (const user of users) {
      await this.prisma.user.update({
        where: {id: user.id},
        data: { status: 'OFFLINE'}
      });
    }
    return users;
  }

  async setStatus(userId: number, status: UserStatus) {
    // await this.prisma.user.findMany().then(list => list.map(u => console.log(u.firstname, u.status)));
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: status }
    });
  }


  async findFriendById(id: number): Promise<Friend> {

    console.log("id = ", id);
    const friend = await this.prisma.friend.findUnique({
      where: {
        id: id, // Correctly passing id as a regular number
      },
    });

    if (!friend) {
      throw new NotFoundException('Ami non trouvé.');
    }

    return friend;
  }


  async deleteFriend(id_first: number, id_second: number): Promise<Friend> {
    const friend = await this.prisma.friend.findFirst({
      where: {
        OR: [
          {
            userId: id_first,
            friendId: id_second,
          },
          {
            userId: id_second,
            friendId: id_first,
          },
        ],
      },
    });

    if (!friend) {
      return
    }

    return this.prisma.friend.delete({
      where: {
        id: friend.id,
      },
    });
  }


  async isFriends(userOneId: number, userTwoId: number): Promise<boolean> {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          {
            userId: userOneId,
            friendId: userTwoId,
            status: 'accepted',
          },
          {
            userId: userTwoId,
            friendId: userOneId,
            status: 'accepted',
          },
        ],
      },
    });

    return !!friendship;
  }

  //async getPlayersExcludingBlockedAndSelfInChannel(currentPlayerId: number, channelId: string): Promise<Player[]> {
  //try {
  //// Récupérer le joueur actuel
  //const currentPlayer = await this.prisma.player.findUnique({
  //where: { id: currentPlayerId },
  //});

  //if (!currentPlayer) {
  //throw new NotFoundException('Joueur actuel non trouvé.');
  //}

  //// Récupérer les joueurs qui ont bloqué le joueur actuel
  //const blockedPlayers = await this.getBlockedPlayers(currentPlayerId);

  //// Récupérer les membres du canal spécifique
  //const channelMembers = await this.prisma.channelMembership.findMany({
  //where: { channelId: channelId },
  //include: { user: { include: { player: true } } },
  //});

  //// Extraire les joueurs des membres du canal
  //const channelPlayers = channelMembers.map((member) => member.user.player);

  //// Récupérer tous les joueurs sauf le joueur actuel
  //const allPlayers = await this.prisma.player.findMany({
  //where: {
  //NOT: {
  //id: currentPlayerId,
  //},
  //},
  //});

  //// Filtrer les joueurs pour exclure ceux qui ont bloqué le joueur actuel
  //const playersExcludingBlocked = allPlayers.filter((player) => {
  //return (
  //!blockedPlayers.some((blockedPlayer) => blockedPlayer.id === player.id) &&
  //!channelPlayers.some((channelPlayer) => channelPlayer.id === player.id)
  //);
  //});

  //return playersExcludingBlocked;
  //} catch (error) {
  //throw new NotFoundException('Une erreur s\'est produite lors de la récupération des joueurs.');
  //}
  //}
  async isBlock(myId: number, senderId: number): Promise<boolean> {

    let friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          {
            userId: myId,
            friendId: senderId,
            status: 'blocked',
          },
          {
            userId: senderId,
            friendId: myId,
            status: 'blocked',
          }
        ]
      },
    });

    if (friendship)
      return true;
    return false;
  }

  async blocklist(myId: number): Promise<number[]> {
    const blockedByYou = await this.prisma.friend.findMany({
      where: {
        userId: myId,
        status: 'blocked',
      },
      select: {
        friendId: true,
      },
    });
    const blockedByYouIds = blockedByYou.map((friend) => friend.friendId);

    const blockedYou = await this.prisma.friend.findMany({
      where: {
        friendId: myId,
        status: 'blocked',
      },
      select: {
        userId: true,
      },
    });
    const blockedYouIds = blockedYou.map((friend) => friend.userId);

    const allBlockedIds = [...blockedByYouIds, ...blockedYouIds];

    return allBlockedIds;
  }

  async getInviteList(channelId: string, myId: number): Promise<Player[]> {

    const channelMembers = await this.prisma.channelMembership.findMany({
      where: {
        channelId,
      },
      select: {
        userId: true,
        isBanned: true,
      },
    });

    const filteredOut = channelMembers.filter((chanm) => chanm.isBanned === false);
    const memberIds = filteredOut.map((member) => member.userId);

    const blockedByYou = await this.prisma.friend.findMany({
      where: {
        userId: myId,
        status: 'blocked',
      },
      select: {
        friendId: true,
      },
    });
    const blockedByYouIds = blockedByYou.map((friend) => friend.friendId);

    const blockedYou = await this.prisma.friend.findMany({
      where: {
        friendId: myId,
        status: 'blocked',
      },
      select: {
        userId: true,
      },
    });
    const blockedYouIds = blockedYou.map((friend) => friend.userId);

    const allBlockedIds = [...blockedByYouIds, ...blockedYouIds];


    const usersToInvite = await this.prisma.user.findMany({
      where: {
        NOT: {
          id: {
            in: [...memberIds, ...allBlockedIds, myId],
          },
        },
      },
      select: {
        player: true,
      },
    });

    const playersToInvite = usersToInvite.map((user) => user.player).filter((player) => player.id !== 0);
    return playersToInvite;
  }

  async getPlayersExcludingBlockedAndSelfInChannel(currentPlayerId: number, channelId: string): Promise<Player[]> {
    try {
      // Récupérer le joueur actuel
      const currentPlayer = await this.prisma.player.findUnique({
        where: { id: currentPlayerId },
      });

      if (!currentPlayer) {
        throw new NotFoundException('Joueur actuel non trouvé.');
      }

      // Récupérer les relations 'Friend' qui ont un état de "blocked"
      const blockedRelations = await this.prisma.friend.findMany({
        where: {
          OR: [
            { userId: currentPlayerId, status: 'blocked' },
            { friendId: currentPlayerId, status: 'blocked' },
          ],
        },
      });

      // Créer un ensemble des IDs des joueurs qui ont bloqué le joueur actuel ou qui sont bloqués par lui
      const blockedPlayerIds = new Set(blockedRelations.map(relation =>
        relation.userId === currentPlayerId ? relation.friendId : relation.userId
      ));

      // Récupérer les membres du canal spécifique
      const channelMembers = await this.prisma.channelMembership.findMany({
        where: { channelId: channelId },
        include: { user: { include: { player: true } } },
      });

      // Extraire les joueurs des membres du canal
      const channelPlayers = channelMembers.map((member) => member.user.player);

      // Récupérer tous les joueurs sauf le joueur actuel et ceux qui sont bloqués
      const eligiblePlayers = await this.prisma.player.findMany({
        where: {
          NOT: [
            { id: { in: Array.from(blockedPlayerIds) } }, // Exclure les joueurs bloqués
            { id: currentPlayerId }, // Exclure le joueur actuel
          ],
        },
      });

      // Filtrez les joueurs éligibles pour s'assurer qu'ils ne sont pas déjà dans le canal
      const playersToInvite = eligiblePlayers.filter((player) =>
        !channelPlayers.some((channelPlayer) => channelPlayer?.id === player.id)
      );

      return playersToInvite;
    } catch (error) {
      throw new NotFoundException('Une erreur s\'est produite lors de la récupération des joueurs.');
    }
  }

  async getAllPlayersExcludingBlockedAndSelf(currentPlayerId: number): Promise<Player[]> {
    try {
      // Récupérer le joueur actuel
      const currentPlayer = await this.prisma.player.findUnique({
        where: { id: currentPlayerId },
      });

      if (!currentPlayer) {
        throw new NotFoundException('Joueur actuel non trouvé.');
      }

      // Récupérer les joueurs qui ont bloqué le joueur actuel
      const blockedPlayers = await this.getBlockedPlayers(currentPlayerId);

      // Récupérer tous les joueurs
      const allPlayers = await this.prisma.player.findMany();

      // Filtrer les joueurs pour exclure le joueur actuel et ceux qui l'ont bloqué
      const playersExcludingBlockedAndSelf = allPlayers.filter((player) => {
        return (
          player.id !== currentPlayerId &&
          !blockedPlayers.some((blockedPlayer) => blockedPlayer.id === player.id)
        );
      });

      return playersExcludingBlockedAndSelf;
    } catch (error) {
      throw new BadRequestException('Une erreur s\'est produite lors de la récupération des joueurs.');
    }
  }

  async getBlockedPlayers(playerId: number): Promise<Player[]> {
    try {
      // Récupérer les relations d'amis bloquées pour le joueur actuel
      const blockedRelations = await this.prisma.friend.findMany({
        where: {
          userId: playerId,
          status: 'blocked',
        },
        select: {
          friend: {
            include: {
              player: true,
            },
          },
        },
      });

      // Extraire les joueurs des relations bloquées
      const blockedPlayers = blockedRelations.map((relation) => relation.friend.player);

      return blockedPlayers;
    } catch (error) {
      throw new NotFoundException('Une erreur s\'est produite lors de la récupération des joueurs bloqués.');
    }
  }


  async getChannelsUserIsNotIn(userId: number): Promise<Channel[]> {
    try {
      // Récupérez tous les canaux
      const channels = await this.prisma.channel.findMany();

      // Récupérez la liste des canaux où l'utilisateur est banni
      const bannedChannels = await this.prisma.channelMembership.findMany({
        where: {
          userId,
          isBanned: true,
        },
        select: {
          channelId: true,
        },
      });

      // Filtrez les canaux où l'utilisateur n'est pas membre et n'est pas banni
      const channelsUserIsNotIn = channels.filter((channel) => {
        return !bannedChannels.some((bannedChannel) => bannedChannel.channelId === channel.id);
      });

      return channelsUserIsNotIn;
    } catch (error) {
      throw new HttpException("Une erreur s'est produite lors de la récupération des canaux.", HttpStatus.BAD_REQUEST);
    }
  }

  async unblockUser(requesterId: number, blockedId: number): Promise<any> {

    let friendship = await this.prisma.friend.findFirst({
      where: {
        userId: requesterId,
        friendId: blockedId,
      },
    });

    return await this.prisma.friend.delete({
      where: {
        id: friendship.id,
      }
    });
  }

  async blockUser(requesterId: number, blockedId: number): Promise<Friend> {

    let friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: requesterId, friendId: blockedId },
          { userId: blockedId, friendId: requesterId }
        ],
      },
    });

    if (friendship) {

      if (friendship.userId === requesterId) {
        return this.prisma.friend.update({
          where: { id: friendship.id },
          data: { status: 'blocked' },
        });
      } else {
        return this.prisma.friend.update({
          where: { id: friendship.id },
          data: {
            status: 'blocked',
            friendId: blockedId,
            userId: requesterId,
          },
        });
      }
    } else {
      return this.prisma.friend.create({
        data: {
          userId: requesterId,
          friendId: blockedId,
          status: 'blocked',
        },
      });
    }
  }

}

