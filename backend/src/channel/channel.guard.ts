import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
  } from '@nestjs/common';
  import { ChannelService } from './channel.service';
  import { Role, ChannelRole } from 'prisma' // Import your enums
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    private readonly logger: Logger = new Logger('RolesGuard');
  
    constructor(private readonly channelService: ChannelService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const userId = request.userId; // Assumed set by JwtAuthGuard
      const channelId = request.params.channelId; // Assuming channel ID is a route parameter
  
      if (!userId || !channelId) {
        throw new ForbiddenException('User or Channel not specified.');
      }
  
      const channel = await this.channelService.findChannelById(channelId);
  
      // If the user is the owner of the channel, they should have access
      if (channel.ownerId === userId) {
        return true;
      }
  
      // Otherwise, check if they are a moderator (ADMIN role) in ChannelMembership
      //const channelMembership = await this.channelService.findMembershipForUserInChannel(userId, channelId);
      const channelMembership = null; //tmp fix
      
      if (channelMembership && channelMembership.role === ChannelRole.ADMIN) {
        return true;
      }
  
      // If neither of the above, deny access
      throw new ForbiddenException('User does not have sufficient rights.');
    }
  }
  