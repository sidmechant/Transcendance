import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TurnOnTwoFactorAuthDto {  
    @IsNotEmpty()
    @IsString()
    twoFactorAuthenticationCode: string;
  }