import { Controller, Get, Redirect, Query, Res, Req, UseGuards } from '@nestjs/common';
import { FortyTwoApiService } from './forty-twoapi.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from "../../jwt/JwtStrategy"
import { HttpService } from '@nestjs/axios';
import { CrudService } from "./crud.service"
import { JwtService } from "../../jwt/jwt.service"
import { verify } from 'jsonwebtoken';
import { Response } from 'express'
import { Public } from '../public.decorator';
@Controller('42')
@Public()
export class FortyTwoApiController extends FortyTwoApiService  {
    protected prisma: CrudService;
    constructor(
        private readonly strategy: JwtStrategy, 
        http: HttpService, 
        prisma: CrudService, 
        jwt: JwtService, 
    ) {
        super(http, prisma, jwt);
        this.prisma = prisma;// Ici vous passez les dépendances nécessaires à FortyTwoApiService
    }
    
    
    //@UseGuards()
    @Get('login')
    @Redirect(process.env.CALLBACK_URL)
    @Public() 
    handleLogin() { 
      return {url : process.env.REDIRECT_URL};
    }
    
	@Get('redirect')
	@Public()
	async handleRedirect(@Req() req, @Res() response: Response) {
		const code = req.query.code;
		try {
			const token = await this.getTokenFortyTwoUser(code).toPromise();
			response.cookie('token', token);
			// Envoyer une page HTML qui ferme la fenêtre
			response.status(200).send(`
				<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<title>Authentification réussie</title>
					<script type="text/javascript">
						window.onload = function() {
							window.close();
						}
					</script>
				</head>
				<body>
					<p>Authentification réussie, fermeture en cours...</p>
				</body>
				</html>
			`);
            // response.status(200).send();
		} catch (error) {
			// Gérer les erreurs ici
			console.error('Erreur lors de l\'obtention de l\'access_token:', error);
			// Redirigez vers une page d'erreur ou effectuez une autre action appropriée en cas d'erreur.
		}
	}

    @Get('user')
    @Public()
    async handleTest(@Req() req, @Res() res: Response) {
        const accessToken = req.cookies.token;
    
        if (!accessToken) {
            return { error: 'Access Token non valide' };
        }
    
        try {
            const response = await this.getInformationUser(accessToken, req, res).toPromise();
            
            if (response && response.data && response.data.id && response.data.login) {
                const responseData = response.data;
                const id = responseData.id;
    
                // Recherchez la session utilisateur dans la base de données
                // console.log('Recherche d\'utilisateur avec l\'ID:', id);
                // const userSession = await this.prisma.findBySessionId(id.toString());
                // console.log('Résultat de la recherche UserSession:', userSession);
                // if (userSession) {
                //     res.clearCookie('jwt_token');
                //     res.clearCookie('token');
                //     throw new UnauthorizedException('Une session est déjà active pour cet utilisateur. Veuillez vous déconnecter et réessayer.');
                // }
    
                // Vérifier si un token JWT valide existe déjà
                const existingJwtToken = req.cookies['jwt_token'];
                if (existingJwtToken) {
                    try {
                        const decoded = verify(existingJwtToken, process.env.JWT_SECRET);
                        if (decoded.sub === id.toString()) {
                            // Supprimer le JWT des cookies
                            res.clearCookie('jwt_token');
                            res.clearCookie('token');
                            // Renvoyer une erreur
                            throw new UnauthorizedException('Déjà connecté. Veuillez vous déconnecter et réessayer.');
                        }
                    } catch (err) {
                        // Si le token existant n'est pas valide, continuez à en créer un nouveau
                    }
                }
    
                await this.strategy.validate(req, res, id);
                res.send({message: 'Logged '});
                // await this.postGeneratetwoAuthentification(id).toPromise();
            } else {
                console.error('La structure de la réponse JSON de l\'API 42 est incorrecte.');
            }
    
            return res;
        } catch (error) {
            console.error('Erreur lors de la requête GET vers l\'API 42:', error);
            return { error: 'Erreur lors de la récupération des informations de l\'utilisateur' };
        }
    }
}    