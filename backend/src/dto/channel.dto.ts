import { IsEmpty, IsInt, IsNotEmpty, IsString, isEmpty } from "class-validator";

export class CreateChannelDto {
    @IsString()
    name: string;

    @IsString()
    username: string;

    @IsString()
    type: 'public' | 'private' | 'protected';

    ownerId?: number;

    @IsString()
    password?: string;
}

export class CreateMpDto {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsString()
  type: 'public' | 'private' | 'protected';

  ownerId?: number;

  @IsString()
  password?: string;

  @IsString()
  oneId: string;

  @IsString()
  twoId: string;
}


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
  currentName: string;
  updateData: UpdateChannelDto;
}

export class SendMessageDTO {
  @IsString()
  channelId: string;

  @IsString()
  userId: string;

  @IsString()
  message: string;
}

export class ChannelIdDTO {
  @IsString()
  channelId: string;
}

export class GetChannelDto {
    @IsString()
    name?: string;

    @IsString()
    readonly channelId?: string;
    
    @IsString()
    readonly password?: string;
    
    @IsString()
    userId: string;

    @IsString()
    ownerId?: string;
}

export class channelUserDTO {
  @IsString()
  channelId: string;

  @IsString()
  userId: string;
}

export class CreateMessageDto {
    @IsString()
    readonly content: string;
  
    @IsString()
    readonly channelId: string;
  
    @IsString()
    readonly channelName?: string;

    @IsString()
    userId: string;
    
    @IsString()
    readonly recepient?: string;
  }

  export class JoinChannelDto { 
    @IsString()
    channelId: string;
  }
  
  export class JoinChannelProtectedDto { 
    @IsString()
    channelId: string;

    @IsString()
    password: string;
  }