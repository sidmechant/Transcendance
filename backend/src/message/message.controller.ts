import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseInterceptors,
	UploadedFiles,
	UseGuards,
	Req,
	Request,
	HttpStatus,
	HttpException,
	Res,
	NotFoundException
  } from '@nestjs/common';
  import { MessageService } from './message.service';
  import { CreateMessageDto } from './dto/create-message.dto';
  import { UpdateMessageDto } from './dto/update-message.dto';
  import { FileFieldsInterceptor } from '@nestjs/platform-express';
  import { EventEmitter2 } from '@nestjs/event-emitter';
  import { JwtAuthGuard } from 'src/auth/jwt.guard';
  import { GetMessageDto } from './dto/get-message.dto';
  import { error } from 'console';
  import { ChatGateway } from 'src/chat/chat.gateway';
  import { UsersService } from 'src/users/users.service';
  import { MessageSocketDto, UserSocketDto } from 'src/dto/chat.dto';
  import { Message, User } from '@prisma/client';
  import { MuteGuard } from './mute.guard';


  @UseGuards(JwtAuthGuard)
  @Controller('message')
  export class MessageController {
	constructor(
	  private readonly messageService: MessageService,
	  private readonly chatGateway: ChatGateway,
	  private readonly userService: UsersService,
	  private eventEmitter: EventEmitter2
	) {}
  
	@UseInterceptors(
	  FileFieldsInterceptor([
		{
		  name: 'attachments',
		  maxCount: 5,
		},
	  ]),
	)
  
	@Post('create')
	@UseGuards(MuteGuard)
	async createMessage(@Req() req, @Body() createMessageDto: CreateMessageDto) {
	  try {
		createMessageDto.userId = req.user.id;
		const message: Message | null = await this.messageService.create(createMessageDto);
		if (!message) throw new error();
  
		const recipient: UserSocketDto | null = await this.userService.getUserSocketDtoByUsername(createMessageDto.recepient);
		if (!recipient)
		  throw new NotFoundException(`User ${createMessageDto.recepient} not found`);
  
		const messageSocketDto: MessageSocketDto = { author: req.user, recipient: recipient, message: message };
		this.chatGateway.handleMessageCreateEvent(messageSocketDto);
	  
		return { status: HttpStatus.OK, message: messageSocketDto, isSuccess: true };
	  } catch (error) {
		return { status: HttpStatus.NOT_IMPLEMENTED, message: `Failed to create a new message. ${error.message}` };
	  }
	}
  
	@UseGuards(JwtAuthGuard)
	@Get('allMessagesChannel')
	async findAllMessagesChannel(@Req() req, @Body() getMessageDto: GetMessageDto) {
	  try {
		const messages = await this.messageService.findAllMessageBychannelId(getMessageDto.channelId);
		if (!messages) throw new error();
		
		const messageSocketDto = { author: req.user, recipient: req.userRecipent, messages: messages };
		this.chatGateway.handleMessageCreateEvent(messageSocketDto);
	
		return { status: HttpStatus.OK, message: messages, isSuccess: true };
	  } catch (error) {
		return { status: HttpStatus.NOT_FOUND, message: `Failed to retrieve messages. ${error.message}` };
	  }
	}
  
	@UseGuards(JwtAuthGuard)
	@Get('myMessages')
	async findAllMessages(@Req() req) {
	  const id: string = req.user.id;
	  try {
		const messages = await this.messageService.findAllMessageByUserId(id);
		if (!messages) throw new error();
  
		const messageSocketDto = { author: req.user, recipient: req.userRecipent, messages: messages };
		this.chatGateway.handleMessageCreateEvent(messageSocketDto);
		
		return { status: HttpStatus.OK, message: messages, isSuccess: true };
	  } catch (error) {
		return { status: HttpStatus.NOT_FOUND, message: `Failed to retrieve the message. ${error.message}` };
	  }
	}
  
  
	@UseGuards(JwtAuthGuard)
	@Get('myMessage')
	async findOneMessage(@Req() req, @Body() getMessageDto: GetMessageDto) {
	  try {
		const messages = await this.messageService.findMessageByMessageId(getMessageDto.messageId);
		if (!messages) throw new error();
  
		const messageSocketDto = { author: req.user, recipient: req.userRecipent, message: messages };
		this.chatGateway.handleMessageCreateEvent(messageSocketDto);
		
		return { status: HttpStatus.OK, message: messages, isSuccess: true };
	  } catch (error) {
		return { status: HttpStatus.NOT_FOUND, message: `Failed to retrieve the message. ${error.message}` };
	  }
	}
  
	@UseGuards(JwtAuthGuard)
	@UseGuards(MuteGuard)
	@Patch('updateMessage')
	async updateMessage(@Req() req, @Body() updateMessageDto: UpdateMessageDto) {
	  try {
		const message = await this.messageService.updateMessageByMessageIdUserID(req.user.id, updateMessageDto);
		if (!message) throw new error();
  
  
		const messageSocketDto = { author: req.user, recipient: req.userRecipent, message: message };
		this.chatGateway.handleMessageUpdate(messageSocketDto);
  
		return { status: HttpStatus.OK, message: message, isSuccess: true };
	  } catch (error) {
		return { status: HttpStatus.NOT_MODIFIED, message: `Failed to update the message. Error ${error.message}`};
	  }
	}
  
	@UseGuards(JwtAuthGuard)
	@Delete('delete')
	async remove(@Req() req, @Body() updateMessageDto: UpdateMessageDto) {
	  try {
		await this.messageService.removeMessageByMessageID(updateMessageDto.messageId);
  
		const messageSocketDto = { author: req.user, recipient: req.userRecipent};
		this.chatGateway.handleMessageUpdate(messageSocketDto);
  
		return { status: HttpStatus.OK, message: 'Message deleted successfully.' };
	  } catch (error) {
		return { status: 'error', message: `Failed to delete the message. Error: ${error.message}` };
	  }
	}
  }
  