import { Channel, Message, User } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsInt, IsDate, IsArray, IsNumber, IsObject, IsString, IsEmpty } from 'class-validator';

export class UserSocketDto {
    @IsInt()
    id: number;

    @IsString()
    username: string;

    @IsString()
    displayname: string;

    @IsString()
    role: string;

    @IsObject()
    user: User;
}

export class MessageSocketDto {
    @IsObject()
    message?: Message;

    @IsObject()
    messages?: Message[];

    author: UserSocketDto;

    recipient: UserSocketDto;
}


export class ChannelSocketDto {
    creator: UserSocketDto;

    recipient?: UserSocketDto;

    lastMessageSent?: MessageSocketDto;
    
    channel: Channel;    
}