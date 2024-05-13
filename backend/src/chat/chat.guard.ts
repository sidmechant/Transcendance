// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { CrudService } from 'src/auth/forty-twoapi/crud.service';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(
//     private readonly reflector: Reflector,
//     private readonly crudService: CrudService
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const userId = request.userId;
//     const channelId = request.params.channelId; // ou là où vous stockez l'id du canal
    
//     // Obtenez les rôles nécessaires depuis les métadonnées de l'itinéraire
//     const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     // Récupérez l'utilisateur et le canal de la base de données
//     const user = await this.crudService.findUserById(userId);
//     const channel = await this.crudService.findChannelById(channelId);

//     // Assurez-vous que l'utilisateur et le canal existent
//     if (!user || !channel) {
//       throw new ForbiddenException("User or Channel does not exist");
//     }
    
//     // Vérifiez si l'utilisateur est autorisé
//     const isAuthorized = this.checkRoles(user, channel, requiredRoles);
    
//     if (!isAuthorized) {
//       throw new ForbiddenException("You don't have permissions to perform this action");
//     }
    
//     return true;
//   }

//   private checkRoles(user: User, channel: Channel, roles: string[]): boolean {
//     // Vérifiez si l'utilisateur est le propriétaire du canal
//     const isOwner = channel.ownerId === user.id;

//     // TODO: Ajoutez d'autres vérifications de rôle ici si nécessaire (e.g., est un modérateur?)

//     // Vérifiez si l'un des rôles nécessaires est satisfait
//     return roles.some((role) => {
//       switch(role) {
//         case 'OWNER': return isOwner;
//         // TODO: Ajoutez d'autres cas de rôle ici
//         default: return false;
//       }
//     });
//   }
// }
