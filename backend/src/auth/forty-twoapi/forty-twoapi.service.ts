import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Res,
  } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, catchError, mergeMap } from 'rxjs';
import { Observable, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { CrudService } from './crud.service'
import * as bcrypt from 'bcrypt'
import { JwtService } from '../../jwt/jwt.service'
import { Request, Response } from 'express';

@Injectable()
export class FortyTwoApiService {
    private readonly apiUrl = 'https://api.intra.42.fr';
    private readonly clientId = process.env.UID
    private readonly clientSecret = process.env.SECRET_ID
    private readonly UrlApiAccess = "https://api.intra.42.fr/oauth/token";
    private readonly CallbackUrl  = process.env.CALLBACK_URL

    
    constructor(private http: HttpService, protected readonly prisma: CrudService, private jwt: JwtService) {}

  
    private async createUserFromResponse(responseData: any) {
    const createPrismCrudDto = {
      id: responseData.id,
      username: responseData.login,
      displayname: responseData.displayname,
      lastname: responseData.last_name,
      firstname: responseData.first_name,
      emails: responseData.email,
      phoneNumbers: responseData.phone,
    };
    const user = await this.prisma.createUser(createPrismCrudDto);
    if (!user) {
      throw new BadRequestException('Erreur lors de la création de l\'utilisateur');
    }

    return user;
  }

    postGeneratetwoAuthentification(id: Number): Observable<any> {
       console.log("POST GENERATE")
        // Utilisez l'opérateur catchError pour gérer les erreurs
        return this.http.post(`${process.env.BACK_URL}/2fa/generate`, {id: id}).pipe(
          catchError((error) => {
            console.error('Error requête post 2fa/generate:', error);
            // Retournez une erreur observable au lieu de lancer une exception
            return throwError(() => new ForbiddenException('Erreur lors de la requête POST'));
          })
        );
      }

    getTokenFortyTwoUser(code: string): Observable<string> {
        
        const data = {
            client_id: this.clientId, 
          
            client_secret: this.clientSecret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: this.CallbackUrl,
        };
          console.log("CLIENT ID", this.clientId);
        console.log("CLIENT SECRET", this.clientSecret);
        console.log("code", code);
        console.log("REDIRECT", this.CallbackUrl);
        return this.http
            .post(this.UrlApiAccess, data)
            .pipe(
                map((response: AxiosResponse<any>) => {

                    // Vérifiez si la réponse contient un access_token
                    if (response.data && response.data.access_token) {
                        console.log('Access Token récupéré avec succès:', response.data.access_token);
                        return response.data.access_token;
                    } else {
                        console.log("PAS DE REPONSE DE LA  PART DE L API DE 42");
                        console.error('Réponse de l\'API 42 incomplète ou sans access_token:', response.data);
                        throw new ForbiddenException('Réponse de l\'API 42 incomplète ou sans access_token');
                    }
                }),
                catchError((error) => {
                    console.error('Erreur lors de la requête POST:', error);
                    return throwError(() => new ForbiddenException('Erreur lors de la requête POST'));
                })
            );
    }

    

    getInformationUser(accessToken: string, req : Request, res: Response): Observable<AxiosResponse<any, any>> {

        console.log("Debug acess token ", accessToken);

        const data = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }

        return this.http.get('https://api.intra.42.fr/v2/me', data)
        .pipe(
            mergeMap(async (response: AxiosResponse<any, any>) => {

                    if (response) {
                        try {
                            const user = await this.createUserFromResponse(response.data);
                            // console.log(user);
                            // console.log(user.id, user.username);
                        return response;
                    } catch (e) {
                        console.log('Error RESPONSE FROM AXIOS 42', e);
                      }
                }
                }),
                catchError((error) => {
                    console.log(`chien => ${error}`)
                    return throwError(() => new ForbiddenException('Erreur lors de la requête GET'));
                })
            );
    }

    async signout(req : Request, res: Response){
        res.clearCookie('token');
        res.clearCookie('jwt_token')
        return res.send({message: "Signout Bye bye"});
    }
}