import { IsNotEmpty, IsInt, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class SendFriendRequestDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 15, { message: 'Le pseudo doit contenir entre 1 et 15 caractères.' })
    receiverPseudo: string;
  }

  export class FriendRequestIdDto {
    @IsInt()
    requesterId: number;
  }

  export class BlockDto {
    @IsInt()
    receiverId: number;
  }
