  import {
    ClassSerializerInterceptor,
    Controller,
    Header,
    Post,
    Get,
    Patch,
    Body,
    HttpCode,
    UseInterceptors,
    Res,
    UseGuards,
    Req,
    NotFoundException,
    BadRequestException,
    UnauthorizedException
  } from '@nestjs/common';
  import { User } from '@prisma/client';
  import { TwoFactorAuthenticationService } from './two-factor-authentication.service';
  import { Response } from 'express';
  import {JwtAuthGuard} from 'src/auth/jwt.guard';
  import * as qrcode from 'qrcode';
  import { CrudService } from '../forty-twoapi/crud.service'
  import {TurnOnTwoFactorAuthDto} from './two-factor-authentification.dto'
  import { randomBytes } from 'crypto';
  import { Skip2FAGuard } from '../2faGuard/Skip2FA.guard';
  export class TwoFactorAuthenticationCodeDto {
  readonly twoFactorAuthenticationCode: string;
  }

  @Controller('2fa')
  // @UseInterceptors(ClassSerializerInterceptor)
  export class TwoFactorAuthenticationController extends CrudService {
    constructor(private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService, 
      private readonly crud: CrudService) {
      super(crud);
    }

    /**
     * Pour envoyer le qr code en mode json il enlever Res responce
     */
    /*@Post('generate')
    // @UseGuards(JwtAuthGuard)
    async register(@Body() { id }: { id: number}, @Res() response: Response) {
      try { 
        id = Number(id);
        console.log("ID ----- : ", id);
        const {secret, otpauthUrl} = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(id); 
        this.twoFactorAuthenticationService.pipeQrCodeStream(response, otpauthUrl);
        const code = await qrcode.toDataURL(otpauthUrl);
        await this.crud.updateTwoFactorAuthenticationSecret(id, secret);
        console.log("code == " + code );
        console.log('HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII');
        response.json({code : code});
        console.log('HEYYYYYY');
      } catch (error) {
        console.log('Erreur dans le controller generate');
        throw new NotFoundException('Erreur lors de la mise à jour du secret 2fa', error);
      }
    }*/

  /**
  * Contrôleur pour la génération de QR Code pour l'authentification à deux facteurs.
  * @class TwoFactorAuthController
  */
  /**
  * Génère et renvoie un QR Code pour la configuration de l'authentification à deux facteurs.
  * Ce endpoint génère un secret pour l'authentification à deux facteurs, convertit
  * ce secret en un QR Code sous forme de Data URL, met à jour ce secret dans la base de données 
  * pour l'utilisateur spécifié et envoie ensuite le secret et le QR Code au client.
  *
  * @route POST /generate
  * 
  * @param {Object} req - L'objet de requête Express.
  * @param {Object} req.body - Le corps de la requête.
  * @param {number} req.body.id - L'identifiant de l'utilisateur pour lequel le QR Code doit être généré.
  * @param {Response} response - L'objet de réponse Express pour envoyer des données au client.
  *
  * @throws {NotFoundException} - Si une erreur se produit lors de la mise à jour du secret dans la base de données.
  * 
  * @returns {Object} Renvoie un objet contenant le secret généré (`code`) et le Data URL du QR Code (`qrCodeDataUrl`).
  *
  * @example
  * // Corps de la requête
  * {
  *   "id": 1234
  * }
  *
  * // Réponse attendue (format JSON)
  * {
  *   "code": "ABCD1234",
  *   "qrCodeDataUrl": "data:image/png;base64,..."
  * }
  */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @Skip2FAGuard()
  async register(@Req() req , @Res() response: Response) {
    try {
        const id = req.userId; 

        console.log("ID ----- : ", id);
        const {secret, otpauthUrl} = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(id); 
        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

        const encryptedSecret = this.twoFactorAuthenticationService.encrypt(secret);

        await this.crud.updateTwoFactorAuthenticationSecret(id, encryptedSecret);
        console.log("RESPONSE QRCODE ::::::: ", qrCodeDataUrl);
        response.json({
            qrCodeDataUrl: qrCodeDataUrl
        });
    } catch (error) {
        console.log('Erreur dans le controller generate', error);
        throw new NotFoundException('Erreur lors de la mise à jour du secret 2fa', error);
    }
  }

  // @Post('turn-on')
  // @HttpCode(200)
  // @UseGuards(JwtAuthGuard)
  // async turnOnTwoFactorAuthentication(@Body() { id }: { id: number }, @Body() { twoFactorAuthenticationCode } : TwoFactorAuthenticationCodeDto) {
  //   try {
  //     id = Number(id);
  //     const AuthenticationSecret = await this.crud.getTwoFactorAuthenticationSecret(id);
  //     const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
  //       twoFactorAuthenticationCode, AuthenticationSecret);
  //     if (!isCodeValid) {
  //       console.log('error in turnOnTwoFactorAuthentication invalid code: ',isCodeValid );
  //       throw new UnauthorizedException('Wrong authentication code');
  //     }
  //     console.log("IscodeValid: ", isCodeValid);
  //   } catch (error) {
  //     console.log(error, 'Error turnOnTwoFactorAuthentication invalid code 1');
  //     throw new NotFoundException('Erreur lors de la validation du code Authentification a double facteur');
  //   }

  //   try {
  //     await this.twoFactorAuthenticationService.turnOnTwoFactorAuthentication(id);
  //   } catch (error) {
  //     console.log('error in turnOnTwoFactorAuthentication turn on impossible');
  //     throw new NotFoundException('Erreur lors de l\'activation de la double Authentification');
  //   }
  // }
  @UseGuards(JwtAuthGuard)
  @Skip2FAGuard()
  @Post('turn-on')
  @HttpCode(200)
  async turnOnTwoFactorAuthentication(
    @Req() req: any,
    @Res() response: Response,
    @Body() twoFactorAuthCodeDto: TurnOnTwoFactorAuthDto
  ): Promise<{ statusCode: number, message: string, isSuccess: boolean }> {
     
      try {
        console.log("TURN ON CONTROLLER");
        const id = req.userId; 
        console.log("TURN ON CONTROLLER");
        console.log("TURN ON CONTROLLER", twoFactorAuthCodeDto);

        // Supposons que l'ID de l'utilisateur est stocké dans req.user.id par JwtAuthGuard
        const { twoFactorAuthenticationCode } = twoFactorAuthCodeDto;
        
        const encryptedPass  =  await this.crud.getTwoFactorAuthenticationSecret(id);
        const AuthenticationSecret = this.twoFactorAuthenticationService.decrypt(encryptedPass);
        console.log("Encrypted Pass:", encryptedPass);
        console.log("Decrypted Authentication Secret:", AuthenticationSecret);
        console.log("CODE" + twoFactorAuthenticationCode);
        const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
          twoFactorAuthenticationCode, AuthenticationSecret
        );
    
        if (!isCodeValid) {
          console.error('Invalid authentication code for user ID:', id);
          throw new UnauthorizedException('Invalid authentication code.');
        }
        // console.log("AVANT SUCCESS");
        await this.twoFactorAuthenticationService.turnOnTwoFactorAuthentication(id);
        // console.log("APRES SUCESS");
        const token = randomBytes(64).toString('hex'); // Utilisez le module 'crypto' pour cela
        // console.log("COOKIE")
        // console.log(response.get('Set-Cookie'));
        response.cookie('2fa_token', token, {
          httpOnly: false,
          // maxAge: 3600 * 1000, // 1 heure, par exemple
          sameSite: 'strict'
      });
      
        // console.log(response.get('Set-Cookie'));
        // response.cookie('2fa_token', token);
        response.status(200).send({
          statusCode: 200,
          message: 'Two-factor authentication activated successfully.',
          isSuccess: true
        });
        return;
        // return response.json({
        //   statusCode: 200,
        //   message: 'Two-factor authentication activated successfully.',
        //   isSuccess: true
        // });
        console.log(response.headersSent);
      }catch (error) {
        if (error instanceof UnauthorizedException) {
          throw new BadRequestException(error.message);
        }
    
        console.error('Error during two-factor authentication activation for user ID:', error.message);
        throw new BadRequestException('Failed to activate two-factor authentication.');
      }
  }


  @Patch('users')
  @UseGuards(JwtAuthGuard)
  @Skip2FAGuard()
  async updatebool(@Req() req , @Res() response: Response){
    try {
    const id = req.userId; 
    await this.twoFactorAuthenticationService.turnOffAuthentification(id);

    response.clearCookie('2fa_token');
    return response.status(200).json({
      statusCode: 200,
      message: "Two-factor authentication disabled"
    });
  } catch (error) {
    // En fonction de l'erreur, nous pouvons décider du type d'exception à renvoyer et du message correspondant.
    if (error instanceof UnauthorizedException) {
      return {
        statusCode: 401,
        message: error.message,
        isSuccess: false
      };
    }
    }
}
  }