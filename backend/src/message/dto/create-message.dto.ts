import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly content: string;

  @IsNotEmpty()
  @IsString()
  readonly channelId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
  
  @IsNotEmpty()
  @IsString()
  readonly recepient: string;
}