// MuteGuard
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ChannelService } from 'src/channel/channel.service';
import { CreateMessageDto } from './dto/create-message.dto';


@Injectable()
export class MuteGuard implements CanActivate {
  constructor(private readonly channelService: ChannelService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId; // cela est extrait du token par JwtGuard
    const body = request.body as CreateMessageDto; // accéder au corps de la requête
    const channelId = body.channelId; // maintenant, nous obtenons le channelId du corps de la requête

    // il serait bon de vérifier si channelId et userId sont présents
    if (!channelId || !userId) {
      // vous pouvez gérer cette situation différemment, peut-être en renvoyant une réponse indiquant que les données nécessaires sont manquantes
      return false;
    }

    const isMuted = await this.channelService.isUserMuted(userId, channelId);
    return !isMuted; // permettre l'action si l'utilisateur n'est pas mis en sourdine
  }
}
