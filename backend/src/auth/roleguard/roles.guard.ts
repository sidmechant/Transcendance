import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CrudService } from '../forty-twoapi/crud.service'; // Mettez à jour avec le bon chemin vers votre CrudService

@Injectable()

export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly crudService: CrudService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;
    
    const request = context.switchToHttp().getRequest();
    const userId = request.userId;
    
    if (!userId) throw new UnauthorizedException('No user id found in request');
      
    const user = await this.crudService.findUserById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    
    if (!roles.includes(user.role) || (user.role === 'STUDENT' && !user.isProfileUpdated))
      throw new UnauthorizedException('User does not have the required role or profile is not updated');
    
    return true;
  }
}
