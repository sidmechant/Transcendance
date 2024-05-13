import { Controller, Get, Post, Body, UseGuards, Param, Req, HttpException, HttpStatus, Logger, NotFoundException, Delete, Patch, Inject, forwardRef } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthUser } from 'src/jwt/auth-user.decorator';
import { ChannelMembership, Message, Player, User } from '@prisma/client';
import { ChannelIdDTO, CreateChannelDto, CreateMessageDto, CreateMpDto, GetChannelDto, JoinChannelDto, JoinChannelProtectedDto, SendMessageDTO, channelUserDTO } from '../dto/channel.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChannelService } from 'src/channel/channel.service';
import { Channel } from '@prisma/client';
import { request } from 'express';
import { ChannelSocketDto } from 'src/dto/chat.dto';
import { error } from 'console';
import { ChatGateway } from 'src/chat/chat.gateway';
import { RolesGuard } from './channel.guard';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { NoBannedUsersGuard } from './no-banned-users.guard';
import { FriendsService } from 'src/friends/friends.service';


@SkipThrottle()
@Controller('channel')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  private logger: Logger = new Logger('ChannelsController');

  constructor(
    private readonly events: EventEmitter2,
    private readonly channelService: ChannelService,
    private readonly chatGateway: ChatGateway,
    private readonly prisma: PrismaService,
    private readonly io: SocketGateway,
    private readonly friendService: FriendsService,
  ) { }

  async initializeAdmins(): Promise<void> {
    // console.log("INIT ADMIN");
    try {
      const allAdmins = await this.channelService.listAllAdmins();
      allAdmins.forEach((admin) => {
        const eventData = {
          channelId: admin.channelId,
          userId: admin.userId,
        };
        this.io.handleAddAdmin(eventData);
      });
    } catch (error) {
      console.error('Failed to initialize admins', error);
    }
  }

  @Post('add-message-channel')
  async addMessageToChannel(@Body() payload: SendMessageDTO): Promise<{ statusCode: number, message: string, isSuccess: boolean }> {
    try {
      const channelId = payload.channelId;
      const userId = Number(payload.userId);

      const {channel, message} = await this.channelService.addMessageToChannel(channelId, userId, payload.message);
      const updatedChannel = channel;
      if (!updatedChannel)
        throw new NotFoundException('Channel not found.');

      //this.events.emit('newMessage', {channelId, message});
      this.io.handleSendMessage({channelId, message});
      return {
        statusCode: HttpStatus.OK,
        message: 'Message added to the channel successfully.',
        isSuccess: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false
      }
    }
  }

  @Post('created-channel')
  async createChannel(@Req() req, @Body() createChannelDto: CreateChannelDto): Promise<{ statusCode: number, message: string, isSuccess: boolean }> {
    this.logger.debug(`EntryPoint begin try ${createChannelDto}`);
    try {
      createChannelDto.ownerId = Number(req.userId);
      
      const newChannel: Channel | null = await this.channelService.createChannel(createChannelDto);
      if (!newChannel)
        throw error();

      const channelSocketDto: ChannelSocketDto = await this.channelService.getChannelSocketDtoByChannel(newChannel);
      if (!channelSocketDto)
        throw new NotFoundException(`Channel ${channelSocketDto.channel.name} not found`);

      this.io.handleNewChannel(newChannel);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Channel created successfully.',
        isSuccess: true
      };
    } catch (error) {
      this.logger.error(`Error ${error.message}`);
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false
      }
    }
  }


  //@Post('create-channel-mp')
  //async createChannelMp(@Body() createChannelDto: CreateChannelMpDto): Promise<{ channelId: string, channelName: string, ownerId: number, players: Player[] }> {
    @Post('createMp')
    async createChannelMpTest(@Body() createObj: any): Promise<boolean> {

      console.log("MP OBJ: ", createObj);
      return true;
    }

    
  @Post('create-channel-mp')
  async createChannelMp(@Body() createChannelDto: any): Promise<{ channelId: string, channelName: string, ownerId: number, players: Player[] }> {
    console.log("in Create channel mp");
    this.logger.debug('EntryPoint begin try: ', createChannelDto);
    try {
      this.logger.debug(`entryPoint`);
      createChannelDto.ownerId = '0';
      this.logger.debug(`DATA name:
        ${createChannelDto.name}
        ownerId: ${createChannelDto.ownerId}
        password: ${createChannelDto.password}
        type: ${createChannelDto.type}
        username ${createChannelDto.username}`);

      const newChannel: Channel | null = await this.channelService.createChannelMp(createChannelDto);
      if (!newChannel)
        throw error();
      this.logger.debug(`MP Channel created ${newChannel}`);

      const channelSocketDto: ChannelSocketDto = await this.channelService.getChannelSocketDtoByChannel(newChannel);
      if (!channelSocketDto)
        throw new NotFoundException(`MP Channel ${channelSocketDto.channel.name} not found`);

      this.logger.debug(`begin event ${channelSocketDto}`);
      this.chatGateway.handleChannelCreate(channelSocketDto);
      this.logger.debug(`EndPoint ${channelSocketDto}`);

      this.io.handleNewChannel(newChannel);

      const formattedChannel = await this.formatChannel(newChannel.id);
      console.log("Success");
      return formattedChannel;

    } catch (error) {
      this.logger.error(`Error MP: ${error.message}`);
      return ;
    }
  }

  @Post(':channelId/accept-channel-invite/:id')
  async acceptChannelInvite(@Param('channelId') channelId: string, @Param('id') id: string) : Promise<{ statusCode: number, message: string, isSuccess: boolean }> {

    console.log("channelId: ", channelId);
    console.log("id: ", id);
    try {
      const userId = Number(id);
      //  Deban 

      
      const updatedChannel = await this.channelService.acceptInviteChannel(channelId, userId);
      if (!updatedChannel)
        return  ; 

      return {
        statusCode: HttpStatus.OK,
        message: 'Member joined the channel successfully.',
        isSuccess: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false
      }
    }
  }

  @Post('add-member-channel')
  async addMemberToChannel(@Body() getChannelDto: GetChannelDto): Promise<{ statusCode: number, message: string, isSuccess: boolean }> {
    try {
      const channelId = getChannelDto.channelId;
      const userId = Number(getChannelDto.userId);

      const updatedChannel = await this.channelService.addMemberToChannel(channelId, userId);
      if (!updatedChannel)
        throw new NotFoundException('Channel not found.');

      return {
        statusCode: HttpStatus.OK,
        message: 'Member added to the channel successfully.',
        isSuccess: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false
      }
    }
  }

  @Delete('remove-member-channel')
  async removeMemberFromChannel(@Body() getChannelDto: GetChannelDto): Promise<{ statusCode: number; message: string; isSuccess: boolean }> {
    try {
      const { channelId, userId } = getChannelDto;

      const updatedChannel = await this.channelService.removeMemberFromChannel(channelId, Number(userId));
      if (!updatedChannel)
        throw new NotFoundException('Channel or member not found.');

      return {
        statusCode: HttpStatus.OK,
        message: 'Member removed from the channel successfully.',
        isSuccess: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false
      }
    }
  }

  @Get('list-members-channel')
  async listMembersByChannelId(getChannelDto: GetChannelDto): Promise<{ statusCode: number, message: string, isSuccess: boolean, members: ChannelMembership[] }> {
    try {
      const members = await this.channelService.listMembersByChannelId(getChannelDto.channelId);
      if (!members)
        throw new NotFoundException('Channel not found.');

      return {
        statusCode: HttpStatus.OK,
        message: 'Members listed successfully.',
        isSuccess: true,
        members,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false,
          members: [],
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false,
        members: [],
      }
    }
  }

  @Get('list-message-channel/:channelId')
  async listMessageByChannelId(@Param() payload: ChannelIdDTO): Promise<{ statusCode: number, message: string, isSuccess: boolean, messages: Message[] }> {
    try {

      const messages = await this.channelService.listMessageByChannelId(payload.channelId);
      if (!messages)
        throw new NotFoundException('Channel not found');

      return {
        statusCode: HttpStatus.OK,
        message: 'Members listed successfully.',
        isSuccess: true,
        messages: messages,
      };

    } catch (error) {

      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false,
          messages: [],
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false,
        messages: [],
      }
    }
  }

  ////////////////////////////////////////////////////////////////// KICK MUTE CONTROLLER/////////////////////////////////////////////////////////////////////////////////////////
  private async getUserIdByPseudo(pseudo: string): Promise<number> {
    const userId = await this.channelService.findUserIdByPseudo(pseudo);
    if (!userId) throw new NotFoundException(`User with pseudo "${pseudo}" not found.`);
    return userId;
  }

  @Post('kick-from-channel/:channelId/:userId')
  async kickFromChannel(@Param('channelId') channelId: string, @Param('userId') userId: string): Promise<boolean> {

    console.log(channelId);
    console.log(userId);
    return true;
  }

  @Get('format_channel')
  async formatChannel(@Body() channelId: string): Promise<{ channelId: string, channelName: string, ownerId: number, players: Player[] }> {

    try {
      const channel = await this.prisma.channel.findUnique({
        where: {
          id: channelId,
        },
        include: {
          members: {
            select: {
              user: {
                select: {
                  player: true
                }
              }
            }
          }
        }
      });

      if (!channel) {
        throw new HttpException('Channel not found', 404);
      }

      const formattedChannel = {
        channelId: channel.id,
        channelName: channel.name,
        ownerId: channel.ownerId,
        players: channel.members.map(member => member.user.player).filter(player => player) // Filter out any null/undefined players
      };

      return formattedChannel;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('An unexpected error occurred', 500);
    }
  }

  @Get('all_from_id')
  async getAllUserChannelWithMembers(@Req() req): Promise<{ channelId: string, channelName: string, ownerId: number, players: Player[] }[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: {
          members: {
            some: {
              userId: Number(req.userId),
            },
          },
        },
        include: {
          members: {
            select: {
              user: {
                select: {
                  status: true,
                  player: true,
                }
              }
            }
          }
        }
      });

      // Since you'll be using async functions inside a map, 
      // you'll need to use Promise.all to wait for all promises to resolve
      const formattedChannels = await Promise.all(channels.map(async channel => {
        const playersWithBlockStatus = await Promise.all(channel.members.map(async member => {
          const player = member.user.player;
          const status = member.user.status;
          if (!player) return null;  // If no player, just return null. We'll filter these out later.
  
          const isBlock = await this.friendService.isBlock(Number(req.userId), player.userId);
          const isBanned = await this.prisma.channelMembership.findFirst({
            where: {
              channelId: channel.id,
              userId: player.id,
            },
            select: {
              isBanned: true,
            }
          });

          if (isBanned.isBanned)
            return null;
          return {
            ...player,
            status: status,
            block: isBlock,
            isBanned: isBanned.isBanned,
          };
        }));
  
        const playerList = playersWithBlockStatus.filter(player => player);
        const myId = Number(req.userId);

        const ban = playerList.filter(player => player.id === myId);

        console.log(`channelName: ${channel.name}`, ban);
        if (!ban || ban.length === 0) {
          return null;
        }

        return {
          channelId: channel.id,
          channelName: channel.name,
          ownerId: channel.ownerId,
          players: playerList, // Filter out any null/undefined players
        };
      }));
  
      return formattedChannels.filter(fchan => fchan);
  
    } catch (error) {
      if (error instanceof HttpException) {
        return null;
      }
    }
  }

  @Patch('join-channel/:channelId')
  @UseGuards(NoBannedUsersGuard)
  async joinChannel(@Req() req, @Body() joinChannelDto: JoinChannelDto): Promise<boolean> {
    try {
      const { channelId } = joinChannelDto;
      const userId: number = req.userId;

      this.logger.debug(`Join-channel ${userId} ${channelId}`);

      //const updatedUser = await this.channelService.addChannelMembershipToUser(channelId, Number(userId));
      const updatedChannel = await this.channelService.addMemberToChannel(channelId, Number(userId));

      if (!updatedChannel) 
        throw new NotFoundException('User or channel not found.');
      return true;
    } catch (error) {
      return false;
    }
  }

  @Patch('join-channel-protected/:channelId')
  async joinChannelProtected(@Req() req, @Body() joinChannelDto: JoinChannelProtectedDto): Promise<boolean> {
    try {
      const { channelId, password } = joinChannelDto;
      //const decryptedPass = this.channelService.decrypt(password);
      const userId: number = req.userId;

      this.logger.debug(`Join-channel-protected ${userId} ${channelId} ${password}`);
      //const updatedUser = await this.channelService.addChannelMembershipToUser(channelId, Number(userId));
      const updatedChannel = await this.channelService.addMemberToChannel(channelId, Number(userId), password);

      if (!updatedChannel)
        throw new NotFoundException('User or channel not found.');

      return true;
    } catch (error) {
      return false;
    }
  }

  @Post('leave-channel')
  async leaveChannel(@Req() req, @Body() joinChannelDto: JoinChannelDto): Promise<boolean> {
    try {
      const { channelId } = joinChannelDto;

      const userId: number = req.userId;
      //const isMemberRemoved = await this.channelService.removeMemberToChannel(channelId, Number(userId));
      const isMembershipRemoved = await this.channelService.removeChannelMembershipToUser(channelId, Number(userId));

      if (!isMembershipRemoved) {
        throw new NotFoundException('User or channel not found.');
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  @Post('leave-channel2')
  async leaveChannel2(@Req() req, @Body() joinChannelDto: JoinChannelDto): Promise<boolean> {
    const userId: number = req.userId;

    return await this.channelService.leaveChannel(userId, joinChannelDto.channelId);
  }

  @Get('available-channels')
  async getAvailableChannels(@Req() req): Promise<Channel[] | null> {
      try {
          const userId = Number(req.userId); 
          const channels = await this.channelService.getAvailableChannelsForUser(userId);
          if (!channels || channels.length === 0) {
            throw new Error();
          }
          return channels;   
      } catch (error) {
        return null;
      }
  }

  @Post('send-message')
  async sendMessage(@Req() req, @Body() createMessageDto: CreateMessageDto): Promise<Message[] | null> {
    try {
      createMessageDto.userId = req.userId;
      if (!createMessageDto.userId)
        throw new NotFoundException('User not found');
  
      const updatedMessages = await this.channelService.addMessageInChannel(createMessageDto);
      const message: string = updatedMessages[updatedMessages.length - 1].content
      this.chatGateway.handleMessageSend(createMessageDto.channelName, message);
      return updatedMessages || null;
    } catch (error) {
      return null;
    }
  }
  

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Post(':channelId/admin/:pseudo')
  @UseGuards(RolesGuard)
  async setAdmin(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {
    const actingUserId = req.userId;
    const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

    try {
         // Mettez à jour la base de données
    const updatedChannelMembership = await this.channelService.setAdmin(actingUserId, targetUserId, channelId);

    const eventData = {
      channelId: channelId,
      userId: targetUserId,
    };

    this.io.handleAddAdmin(eventData);
    return updatedChannelMembership;
    } catch (error) {
     return ;
    }
  }

@Patch(':channelId/remove-admin/:pseudo')
@UseGuards(RolesGuard)
async removeAdmin(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {
  const actingUserId = req.userId;
  const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

  try {
    // Mettez à jour la base de données
    const updatedChannelMembership = await this.channelService.removeAdmin(actingUserId, targetUserId, channelId);

    const eventData = {
      channelId: channelId,
      userId: targetUserId,
    };

    this.io.handleRemoveAdmin(eventData);
    return updatedChannelMembership;
  } catch (error) {
 
    return ;
  }
}



@Post(':channelId/mute/:pseudo')
// @UseGuards(RolesGuard)
async muteUser(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {
  const actingUserId = req.userId;
  const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

  try {
    const updatedChannelMembership = await this.channelService.muteUser(actingUserId, targetUserId, channelId, 1);

    // Si l'utilisateur est mis en sourdine avec succès, émettez l'événement avec les détails nécessaires.
    if (updatedChannelMembership.mutedUntil) {
      const eventData = {
        channelId,
        userId: targetUserId,
        mutedUntil: updatedChannelMembership.mutedUntil,
      };

      // Émettre un événement qui sera écouté par le gateway Socket pour informer tous les clients connectés.
      //this.events.emit('userMuted', eventData);
      this.io.handleAddMuted({channelId, userId: targetUserId});
    }

    return updatedChannelMembership;
  } catch (error) {
    // Gestion appropriée des erreurs (à déterminer en fonction de votre logique d'application)
    console.error(error);
    return ;// ou return une réponse d'erreur personnalisée.
  }
}

@Patch(':channelId/remove-mute/:pseudo')
// @UseGuards(RolesGuard)
async unmuteUser(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {
  const actingUserId = req.userId;
  const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

  try {
    const updatedChannelMembership = await this.channelService.unmuteUser(actingUserId, targetUserId, channelId, 1);

    // Si l'utilisateur est mis en sourdine avec succès, émettez l'événement avec les détails nécessaires.
    if (updatedChannelMembership.mutedUntil) {
      const eventData = {
        channelId,
        userId: targetUserId,
        mutedUntil: updatedChannelMembership.mutedUntil,
      };

      // Émettre un événement qui sera écouté par le gateway Socket pour informer tous les clients connectés.
      //this.events.emit('userMuted', eventData);
      this.io.handleRemoveMuted({channelId, userId: targetUserId});
    }

    return updatedChannelMembership;
  } catch (error) {
    // Gestion appropriée des erreurs (à déterminer en fonction de votre logique d'application)
    console.error(error);
    return ;// ou return une réponse d'erreur personnalisée.
  }
}


@Post(':channelId/kick/:pseudo')
// @UseGuards(RolesGuard)
async removeUser(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {

  console.log("REMOVE USER");
  const actingUserId = req.userId;
  const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

  this.io.handleSendEvent({target: `${targetUserId}`, type: 'kick', content: 'You have been kick', data: channelId});
  try {
    const removedChannelMembership = await this.channelService.removeUser(actingUserId, targetUserId, channelId);

    // Émettre un événement pour informer le ChatGateway qu'un utilisateur a été supprimé du canal
    const eventData = {
      channelId,
      userId: targetUserId,
    };
    this.io.handleUserRemoved(eventData);

    return removedChannelMembership;
  } catch (error) {
    if (error.message.includes('Canal introuvable')) {
      return ;
    }
    return ;
  }
}

@Post(':channelId/ban/:pseudo')
// @UseGuards(RolesGuard)
async banUser(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {
  const actingUserId = req.userId;
  const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

  try {
    const bannedUser = await this.channelService.banUser(actingUserId, targetUserId, channelId);
    //const removedUser = await this.channelService.removeUser(actingUserId, targetUserId, channelId);
   
    const banEventData = {
      channelId,
      userId: targetUserId,
      isBanned: true,
    };
    this.io.handleSetBan(banEventData);

    const removalEventData = {
      channelId,
      userId: targetUserId,
    };
    this.io.handleUserRemoved(removalEventData);
    this.io.handleSendEvent({target: `${targetUserId}`, type: 'kick', content: 'You have been kick', data: channelId});

    return { bannedUser };
  } catch (error) {
    // Gérer les erreurs
    console.error(error.message);
    return ;
  }
}

@Patch(':channelId/remove-ban/:pseudo')
// @UseGuards(RolesGuard)
async unbanUser(@Req() req, @Param('channelId') channelId: string, @Param('pseudo') pseudo: string) {
  const actingUserId = req.userId;
  const targetUserId = await this.channelService.getUserIdByPseudo(pseudo);

  try {
    // Effectuer le bannissement dans le service
    const updatedChannelMembership = await this.channelService.unbanUser(actingUserId, targetUserId, channelId);

    // Émettre un événement pour informer le ChatGateway que l'utilisateur a été banni
    const eventData = {
      channelId,
      userId: targetUserId,
      isBanned: false, // Vous pouvez personnaliser les données de l'événement selon vos besoins
    };
    this.io.handleRemoveBan(eventData);


    return updatedChannelMembership;
  } catch (error) {
    return ;
  }
}



}