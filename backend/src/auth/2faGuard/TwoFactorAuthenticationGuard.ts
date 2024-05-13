import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CrudService } from '../forty-twoapi/crud.service';
import { UnauthorizedException } from '@nestjs/common';
import { Public } from '../public.decorator';
import { Request } from 'express';
import { Skip2FAGuard } from './Skip2FA.guard';


@Injectable()
export class TwoFactorAuthenticationGuard implements CanActivate {
  constructor(private readonly crudService: CrudService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId;

    try {
      // Exclure certaines routes
      const isPublic = Reflect.getMetadata('isPublic', context.getHandler());
      // console.log("JWTISPUBLIC" + isPublic)
      if (isPublic) {
        console.log("ROUTE PUBLIQUE");
        return true; // Autoriser l'accès sans vérification JWT
      }
      const skip2faGuard = Reflect.getMetadata('skip2faGuard', context.getHandler());
      if (skip2faGuard) {

        return true;
      }

      // Récupérez l'utilisateur de la base de données
      const dbUser = await this.crudService.findUserById(userId);

      // Si l'authentification à deux facteurs est activée, renvoyez false pour bloquer la requête
      if (dbUser && dbUser.isTwoFactorAuthenticationEnabled) {
        console.log("CHECK COOKIE 2fa");
        // Si le cookie contient le token et qu'il est valide (vous pouvez ajouter une vérification d'expiration ici si nécessaire)
        if (request.cookies['2fa_token']) {
          return true;
        }
        console.log("CHECK COOKIE FALSE");
        throw new UnauthorizedException({
          statusCode: 428, // Precondition Required
          error: 'Two-factor authentication is required.',
        });
      }

      return true;

    } catch (error) {
      console.error("Error in TwoFactorAuthenticationGuard:", error);
      // Vous pouvez renvoyer une réponse personnalisée en cas d'erreur ou simplement laisser l'exception être propagée.
      throw new UnauthorizedException({
        statusCode: 428,
        error: 'Two-factor authentication is required.'
      });
    }
  }
}
