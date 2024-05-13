import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { ChannelService } from './channel.service';

@Injectable()
export class NoBannedUsersGuard implements CanActivate {
  constructor(private channelService: ChannelService) {} // utilisation de channelService au lieu de prisma directement.

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId; // récupéré du JWT.
    const channelId = request.params.channelId; 

    if (!userId || !channelId) {

        return false 
    }

    // Ici, nous utilisons channelService pour interagir avec Prisma, au lieu d'utiliser Prisma directement.
    const channelMembership = await this.channelService.getChannelMembership({
      userId: userId, // correction ici, cela devrait être userId pas user.id
      channelId: channelId,
    });

    if (channelMembership && channelMembership.isBanned) {
      // L'utilisateur est banni, donc l'accès est refusé.
        return false;
    }

    return true; // l'utilisateur est autorisé à accéder au canal
  }
}
