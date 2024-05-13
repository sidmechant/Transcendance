
import { IsNotEmpty, IsInt, IsString, IsUrl, Length, MaxLength } from 'class-validator';



export class UpdateChannelDto {
    newname: string;
    name: string;
    ownerId: number;
    newownerId: number;
    password?: string;
    newpassword?: string;
    newtype: 'public' | 'private' | 'protected ';
}


export class SearchChannelByNameDto {
    name: string;
}

export class UpdateChannelByNameDto {
  currentName: string; // Nom actuel du canal
  updateData: UpdateChannelDto; // Données pour mettre à jour
}
