import { Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service'; // Assurez-vous que le chemin d'accès est correct
import { User } from '@prisma/client'; // Importez le type User depuis les modules Prisma
import { Role } from '@prisma/client';

const ADMIN_IDS = [91763, 40335, 95280]; 


@Injectable()
export class CrudService extends PrismaService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }


  async createUser(userObj: any): Promise<User> {
    try {

      let userItem = await this.prisma.user.findUnique({
        where: {
          username: userObj.username,
        }
      });
      if (userItem) {
        return userItem;
      }
      const role = ADMIN_IDS.includes(userObj.id) ? Role.ADMIN : Role.STUDENT;
      // this.prisma.$transaction(async (prisma) => {
        userItem = await this.prisma.user.create({
          data: {
            id: userObj.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            username: userObj.username,
            displayname: userObj.displayname,
            lastname: userObj.lastname,
            firstname: userObj.firstname,
            role: role,// Attribue le rôle en fonction de l'ID
            emails: userObj.emails,
            phoneNumbers: userObj.phoneNumbers,
            urlPhotoProfile: "",
            profileurl: "",
            photourl:"",
            player: {
              create: {
                id: userObj.id, // Utilisez le même ID que l'utilisateur
                // autres champs du joueur
              },
            },
          },
          include: {
            player: true,
          },
        });
      // });

      if (!userItem) {
        throw new Error("Erreur lors de la création de l'utilisateur");
      }
  
      return userItem;
    } catch (error) {
      console.log("Error CRUD: ", error);
      throw error;
    }
  }
  
/*  async createUser(userObj: any): Promise<User> {
    try {
      let userItem = await this.prisma.user.findUnique({
        where: {
          username: userObj.username,
        },
      });
      if(userItem){
        return userItem;
      }
      if (!userItem) {
        userItem = await this.prisma.user.create({
          data: {
            id: userObj.id, // Laissez cette ligne telle quelle, Prisma générera automatiquement l'ID
            createdAt: new Date(), // Utilisez la date et l'heure actuelles
            updatedAt: new Date(), // Utilisez la date et l'heure actuelles   
            username: userObj.username,
            displayname: userObj.displayname,
            lastname: userObj.lastname,
            firstname: userObj.firstname,
            profileurl: userObj.profileurl,
            emails: userObj.emails,
            phoneNumbers: userObj.phoneNumbers,
            photourl: userObj.photourl,
          },
        });
      }

      if (!userItem) {
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }

      return userItem;
    } catch (error) {
      console.log("Error CRUD: ", error);
      throw error; // Lancez une exception en cas d'erreur
    }
  }*/

  // Autres méthodes pour effectuer des opérations CRUD
  async findUserById(id: number): Promise<User | null> {
    try {
      const user =  await this.prisma.user.findUnique({
        where: {
          id: id,
        },
      });
        
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      console.error("Error finding user by ID:", error);
    }
  }
  async updateUserAuthenticationSecret(id: number, secret: string) {
    await this.prisma.user.update({
      where: { id: id },
      data: { twoFactorAuthenticationSecret: secret },
    });
  }

  async updateUserAuthenticationEnabled(id : number, value: boolean) {
    // console.log("UPTADED BOOL");

    await this.prisma.user.update({
      where: {id: id},
      data: { isTwoFactorAuthenticationEnabled: value}
    });
    // console.log("TRY USER");
    const user = this.findUserById(id);
    console.log((await user).isTwoFactorAuthenticationEnabled);
  }

  async getTwoFactorAuthenticationSecret(id: number) {  
    const user = await this.findUserById(id);
    if (!user)
      throw new NotFoundException("Error getTwoFactorAuthenticationSecret");
    return user.twoFactorAuthenticationSecret;
  }

  async updateTwoFactorAuthenticationSecret(id: number, newSecret : string) {  
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { twoFactorAuthenticationSecret: newSecret },
    });
    if (!updatedUser)
      throw new NotFoundException("Error getTwoFactorAuthenticationSecret");
    return updatedUser.twoFactorAuthenticationSecret;
  }

/*///////////////////////////////////////////////////////////////////*

            SESSION ID FONCTION 
**/
async updateSessionIdForUser(id: number, sessionId: string): Promise<User> {
  return this.prisma.user.update({
    where: { id: id },
    data: { sessionId: sessionId },
  }).catch(error => {
    if (error.code === 'P2025') {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    throw error;
  });
}


  // async getSessionIdForUser(id: number): Promise<string | null> {
  //   const user = await this.findUserById(id);
  //   return user?.sessionId || null;
  // }
  
  // async deleteSessionIdForUser(id: number): Promise<User> {
  //   return this.prisma.user.update({
  //     where: { id: id },
  //     data: { sessionId: null },
  //   });
  // }
  // async findBySessionId(sessionId: string): Promise<User | null> {
  //   return this.prisma.user.findUnique({
  //     where: {
  //       sessionId: sessionId,
  //     },
  //   });
  // }



  async getSessionIdForUser(id: number): Promise<string | null> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user?.sessionId || null;
  }
  
  async deleteSessionIdForUser(id: number): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return this.prisma.user.update({
      where: { id: id },
      data: { sessionId: null },
    });
  }
  
  async findBySessionId(sessionId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        sessionId: sessionId,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with session ID ${sessionId} not found.`);
    }
    return user;
  }








/////////////////////////////////////////////////////////////////////////////////////////////


async checkProfileUpdated(userId: number): Promise<boolean> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { player: true },
  });

  if (!user) {
    return false;
  }

  if (user.player.pseudo && user.player.urlPhotoProfile) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isProfileUpdated: true,
        role: 'USER',
      },
    });
    return true;
  }
  return false;
}



}