import { Message } from "@prisma/client";
import { IsEmpty, IsNotEmpty, IsString, isEmpty } from "class-validator";

export class NewMessageDTO {
	@IsString()
	channelId: string;

	message: Message;
}