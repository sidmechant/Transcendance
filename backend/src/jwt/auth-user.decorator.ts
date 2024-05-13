import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user; // Vous devez vous assurer que votre JwtAuthGuard place l'utilisateur dans la propriété "user" de la demande.
  },
);