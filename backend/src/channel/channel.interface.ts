// Importez les énumérations Role et UserStatus
enum Role {
    USER = 'USER',
    STUDENT = 'STUDENT',
    ADMIN = 'ADMIN',
  }
  
  enum UserStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    IN_GAME = 'IN_GAME',
  }
  
  // Modèle pour représenter les utilisateurs
  export interface User {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    username: string;
    displayname: string;
    role: Role;
    lastname: string;
    firstname: string;
    profileurl: string;
    emails: string;
    phoneNumbers?: string | null;
    photourl?: string | null;
    twoFactorAuthenticationSecret?: string | null;
    isTwoFactorAuthenticationEnabled: boolean;
    ownedChannels: Channel[];
    channels: ChannelMembership[];
    messages: Message[];
    player?: Player | null;
    urlPhotoProfile?: string | null;
    sessionId?: string | null;
    isProfileUpdated: boolean;
    status: UserStatus;
    requestedFriends: Friend[];
    receivedRequests: Friend[];
  }
  
  // Modèle pour représenter les canaux de chat
  export interface Channel {
    id: string;
    name: string;
    type: string;
    password?: string | null;
    createdAt: Date;
    ownerId: number;
    owner: User;
    messages: Message[];
    members: ChannelMembership[];
  }
  
  // Modèle pour représenter les messages dans un canal de chat
  export interface Message {
    id: string;
    content: string;
    createdAt: Date;
    channelId: string;
    channel: Channel;
    userId: number;
    user: User;
  }
  
  // Table de jonction pour la relation plusieurs à plusieurs entre User et Channel
  export interface ChannelMembership {
    id: number;
    userId: number;
    channelId: string;
    user: User;
    channel: Channel;
  }
  
  // Modèle pour représenter les matchs
  export interface Match {
    id: number;
    playerAId: number;
    playerBId: number;
    scoreA: number;
    scoreB: number;
    playedAt: Date;
    playerA: Player;
    playerB: Player;
  }
  
  // Modèle pour représenter les joueurs
  export interface Player {
    id: number;
    pseudo?: string | null;
    urlPhotoProfile?: string | null;
    matchesA: Match[];
    matchesB: Match[];
    userId: number;
    user: User;
  }
  
  // Modèle pour représenter les amis
 export  interface Friend {
    id: number;
    userId: number;
    friendId: number;
    status: string; // "requested", "accepted", "declined", "blocked", etc.
    user: User;
    friend: User;
  }
 
  // Interface AccessParams
export interface AccessParams {
    id: string; // L'ID du canal ou de l'entité à laquelle vous souhaitez accéder
    userId: number; // L'ID de l'utilisateur qui tente d'accéder à l'entité
  }
  
  // Interface CreatechannelParams
  export interface CreatechannelParams {
    creator: User; // L'utilisateur qui crée le canal
    username: string;
    message: string;
    params: {
      username: string; // Le nom d'utilisateur du destinataire du canal
      message: string; // Le message initial du canal
    };
  }
  
  // Interface GetchannelMessagesParams
  export interface GetchannelMessagesParams {
    id: string; // L'ID du canal pour lequel vous souhaitez obtenir des messages
    limit: number; // Le nombre maximum de messages à obtenir
  }
  
  // Interface UpdatechannelParams
  export interface UpdatechannelParams {
    id: string; // L'ID du canal à mettre à jour
    lastMessageSent: Date; // La date du dernier message envoyé dans le canal
  }

export interface IChannelsService {
  getchannels(id: number): Promise<Channel[]>;
  findById(id: string): Promise<Channel | null>;
  isCreated(userId: number, recipientId: number): Promise<Channel | null>;
  createchannel(creator: any, params: CreatechannelParams): Promise<Channel>;
  hasAccess(params: AccessParams): Promise<boolean>;
  save(channel: any): Promise<Channel>;
  getMessages(params: GetchannelMessagesParams): Promise<Channel | null>;
  update(params: UpdatechannelParams): Promise<void>;
}
