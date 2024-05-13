
import { IsString, IsNotEmpty } from 'class-validator';

export class GetMessageDto {
    @IsNotEmpty()
    @IsString()
    readonly channelId: string;

    @IsNotEmpty()
    @IsString()
    readonly messageId: string; 

    @IsNotEmpty()
    @IsString()
    userdId: string;
}