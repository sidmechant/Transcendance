import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { CrudService } from './forty-twoapi/crud.service';
import { Public } from './public.decorator';



@Injectable()
export class JwtAuthGuard implements CanActivate {
  
  constructor(private readonly crudService: CrudService) {} // Injectez le CrudService

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    // console.log("JWT GUARD ACTIVATED");
    // console.log('REQUEST ======', request);

    const isPublic = Reflect.getMetadata('isPublic', context.getHandler());
    // console.log("JWTISPUBLIC" + isPublic)
    if (isPublic) {
      console.log("ROUTE PUBLIQUE");
      return true; // Autoriser l'accès sans vérification JWT
    }
    try {
      const cookie = request.cookies['jwt_token'];
      if (!cookie){
        res.clearCookie('token');
       throw new UnauthorizedException('No token provided');
      }

      const decoded = verify(cookie, process.env.JWT_SECRET) as JwtPayload;
      if (!decoded || !decoded.sub || !decoded.sessionId){
        res.clearCookie('jwt_token');
        res.clearCookie('token');
        console.log('PREMIERE ERREUR');
        throw new UnauthorizedException('Invalid token');
      }

      // Vérifiez le sessionId avec la base de données
      const user = await this.crudService.findUserById(Number(decoded.sub)); // Supposons que vous ayez une méthode comme celle-ci dans votre CrudService
      if (user.sessionId !== decoded.sessionId) {
        res.clearCookie('jwt_token');
        res.clearCookie('token');
        throw new UnauthorizedException('Logged in from another session');
      }

      request.userId = decoded.sub;
      return true;
    } catch (err) {
      // console.log(err);
      return false;
    }
  }
}

