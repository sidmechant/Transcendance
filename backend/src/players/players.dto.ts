import { IsNotEmpty, IsInt, IsString, IsUrl, Length, MaxLength } from 'class-validator';


export class UpdatePhotoDto {
  @IsNotEmpty({ message: 'L\'URL ne doit pas être vide' })
  @IsString({ message: 'L\'URL doit être une chaîne de caractères' })
  // @IsUrl({}, { message: 'L\'URL n\'est pas valide' })
  urlPhotoProfile: string;
}

export class FromTokenDto {
  token: string;
}

export class UpdatePseudoDto {
    @IsString({ message: 'Le pseudo doit être une chaîne de caractères.' })
    @IsNotEmpty({ message: 'Le pseudo ne peut pas être vide.' })
    @Length(1, 15, { message: 'Le pseudo doit avoir entre 1 et 15 caractères.' })
    pseudo: string;
  }

  export class PseudoDto {
    @IsString()
    @IsNotEmpty({ message: 'Le pseudo ne peut pas être vide.' })
    @MaxLength(15, {
      message: 'Le pseudo ne peut contenir plus de 15 caractères.',
    })
    readonly pseudo: string;
  }

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
