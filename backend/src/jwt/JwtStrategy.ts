import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Res, Req } from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { Request, Response } from 'express';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
/**
 * @class JwtStrategy
 * @classdesc A strategy used for handling JSON Web Tokens
 * @extends PassportStrategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  
  /**
   * @constructor
   * @param {JwtService} jwtService - The injected JwtService.
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly crudService: CrudService // Injecter le CrudService
  ) {
    super();
  }

  /**
   * @async
   * @method validate
   * @desc This method is called for validation of user and setting JWT cookie.
   * @param {Request} request - The express request object.
   * @param {Response} response - The express response object.
   * @returns {Promise<any>} - The user object if user is authenticated successfully.
   * @throws {UnauthorizedException} - If user is not authenticated.
   */
  async validate(@Req() request: Request, @Res() response: Response, id: string) {
    try {
      //console.log('VALIDATE TOKEN SIGN');
      const sessionId = this.jwtService.qgenerateUniqueSessionId(id);
      //console.log('SESSION ID ', sessionId);
      const userId = Number(id);


      const updated = await this.crudService.updateSessionIdForUser(userId, sessionId);
      if (!updated) {
        throw new Error('Failed to update sessionId for user');
      }

      const token = this.jwtService.createToken(id, sessionId);
	  //console.log('TOKEN SIGN ', token);
      response.cookie('jwt_token', token, { httpOnly: false, sameSite: 'strict' }); // secure: true, to send cookies over HTTPS only, and sameSite: 'Strict' for CSRF protection.
          } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
  
  /**
   * @private
   * @async
   * @method authenticateUser
   * @desc A method to authenticate the user based on the provided credentials.
   * @param {any} credentials - The credentials provided by the user.
   * @returns {Promise<any>} - The user object if authenticated successfully.
   * @throws {UnauthorizedException} - If authentication fails.
   */
  private async authenticateUser(credentials: any): Promise<any> {
    // Implementation details depends on your user authentication logic
    // For instance, if you use a UserService:
    // const user = await this.userService.validateUser(credentials.username, credentials.password);
    // return user;
  }
}
