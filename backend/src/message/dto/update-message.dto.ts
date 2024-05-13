import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly content: string;

  @IsNotEmpty()
  @IsString()
  readonly messageId: string
}