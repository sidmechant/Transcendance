import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify, VerifyErrors } from 'jsonwebtoken'; // Importez 'verify' ici
import { randomBytes } from 'crypto';

@Injectable()
export class JwtService {
  private readonly jwtSecret = process.env.JWT_SECRET;

  constructor() {}

  /**
   * @method createToken
   * @desc Méthode pour créer un token JWT.
   * @param {string} userId - L'ID de l'utilisateur pour lequel créer le token.
   * @returns {string} - Le token JWT généré.
   */
  createToken(userId: string, sessionId: string): string {
    //console.log('CREATE TOKEN');
    const payload = {
      sub: userId,
      sessionId: sessionId
    };
    return sign(payload, this.jwtSecret, { expiresIn: '4h' });
  }

  /**
   * @method verifyToken
   * @desc Méthode pour vérifier un token JWT.
   * @param {string} token - Le token JWT à vérifier.
   * @throws {UnauthorizedException} - Si le token est invalide ou expiré.
   */
  verifyToken(token: string): void {
    verify(  // Utilisez 'verify' directement ici
      token,
      this.jwtSecret,
      (err: VerifyErrors | null) => {
        if (err) throw new UnauthorizedException('Invalid token');
      }
    );
  }




/**
 * @function generateUniqueSessionId
 * @desc Génère un identifiant de session unique.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {string} - L'identifiant de session généré.
 */
qgenerateUniqueSessionId(userId: string): string {
  const timestamp = Date.now().toString();
  const randomData = randomBytes(16).toString('hex');
  return `${userId}-${timestamp}-${randomData}`;
}

}
