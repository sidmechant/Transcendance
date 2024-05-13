import { Injectable, NotFoundException, Res} from '@nestjs/common';
import { authenticator } from 'otplib';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@prisma/client';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import { CrudService } from '../forty-twoapi/crud.service'
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import {TurnOnTwoFactorAuthDto} from './two-factor-authentification.dto'
@Injectable()
export class TwoFactorAuthenticationService extends CrudService {
  public readonly ALGORITHM = 'aes-192-cbc';
  private readonly KEY_LENGTH = 24;
  private readonly IV_LENGTH = 16;
  private readonly PASSWORD = process.env.PASSWORD_2FA// Choisissez un mot de passe fort
  private key: Buffer;

  constructor(private readonly crud: CrudService) {
    super(crud);
    scrypt(this.PASSWORD, 'salt', this.KEY_LENGTH, (err, derivedKey) => {
      if (err) throw err;
      this.key = derivedKey;
    });
  }

  public encrypt(text: string): string {
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  public decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(this.ALGORITHM, this.key, iv);
    const decryptedBuffers = [decipher.update(encryptedText)]; // Retourne un Buffer
    decryptedBuffers.push(decipher.final()); // Ajoute un autre Buffer à notre tableau
    return Buffer.concat(decryptedBuffers).toString('utf8'); // Concatène et convertit en string
}

  // public async generateTwoFactorAuthenticationSecret(email: string, userId: number) {
  //     try {
  //       console.log("mail === " + email + " user id ===  " + userId);
  //       const secret = authenticator.generateSecret();
  //       const otpauthUrl = authenticator.keyuri(
  //         email,
  //         process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME,
  //         secret
  //         ); 
  //         console.log("ICI!", email, userId);
  //         await this.crud.updateUserAuthenticationSecret(userId, secret);
  //         return {
  //           secret,
  //           otpauthUrl,
  //         };
  //     } catch (error) {
  //       console.error('Error generateTwoFactorAuthenticationSecret');
  //       throw new NotFoundException('Erreur lors de la génération du secret 2FA');
  //     }
  // }


  public async generateTwoFactorAuthenticationSecret(userId: any) {
    try {
        userId = userId.toString();
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(
            userId,
            process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME,
            secret
        );
        console.log(' ---- generateTwoFactorAuthenticationSecret --- ');
        console.log("Generated OTP URL:", otpauthUrl);
        console.log("Generated Secret: ", secret);      
        return {
            secret,
            otpauthUrl,
        };
    } catch (error) {
        console.error('Error generateTwoFactorAuthenticationSecret:', error);
        throw new NotFoundException('Erreur lors de la génération du secret 2FA');
    }
}



  public async turnOnTwoFactorAuthentication(userId: number) {
    try {
      console.log("MAJ BOOLEN 2fa TRUE");
      await this.crud.updateUserAuthenticationEnabled(userId, true);
      
    } catch (error) {
      console.error("Error turnOnTwoFactorAuthentication");
      throw new NotFoundException("Erreur lors de l'activation de la double authentification");
    }
  }

  public async turnOffAuthentification(userId :number) {
    try {
      console.log("OFF 2FA BOOL");
      await this.crud.updateUserAuthenticationEnabled(userId, false);
    } catch (error) {
      console.log("Error TurnOff2fa");
      throw new NotFoundException("Erreur lors de la desactivation de la 2fa");
    }
  }

  public async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
    try {
      return toFileStream(stream, otpauthUrl);
    } catch (error) {
      console.error('Error pipeQrCodeStream');
      throw new NotFoundException('Erreur lors de la création du code QR');
    }
  }

  public isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, twoFactorAuthenticationSecret: string) {
    try {
      console.log("Debug", twoFactorAuthenticationCode, twoFactorAuthenticationSecret);
      return authenticator.verify({token: twoFactorAuthenticationCode, secret: twoFactorAuthenticationSecret });
    } catch (error) {
      console.log("error in isTwoFactorAuthenticationCodeValid");
      throw new NotFoundException('Erreur lors de la verification du token generer par le qrcode');
    }
  }


}