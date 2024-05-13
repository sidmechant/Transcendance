import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Channel, User } from '@prisma/client';
import { ChannelService } from 'src/channel/channel.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService, private readonly channelService: ChannelService) {}

  async findChannelById(id: string): Promise<boolean> {
    try {
      const channel = await this.prisma.channel.findFirst({
          where: { id },
          include: {
              messages: true,
              owner: true,
              members: true,
          }
      });
      if (!channel)
        return false;
      return true;
    } catch (err) {
      return null;
    }
} 

  async create(createMessageDto: CreateMessageDto) {
    try {
      const { content, channelId, userId } = createMessageDto;
      const channel = this.channelService.findChannelByChannelIdOwnerId(channelId, createMessageDto.userId);
      if (!channel)
        throw new NotFoundException('cannal dont existe');
      const id: number = Number(userId);
      const message = await this.prisma.message.create({
        data: {
          content,
          channelId,
          userId: id,
        },
      });

      return message;
    } catch (error) {
      throw new BadRequestException(`Failed to create a new message. Error: ${error.message}`);
    }
  }

  async findMessageByMessageId(messageId: string) {
    try {
      const messages = await this.prisma.message.findFirst({
        where: { id: messageId},
      });
      return messages;
    } catch (error) {
      throw new BadRequestException('Failed to retrieve messages.');
    }
  }

  async findAllMessageBychannelId(channelId: string) {
    try {
      const messages = await this.prisma.message.findMany({
        where: { channelId },
      });
      return messages;
    } catch (error) {
      throw new BadRequestException('Failed to retrieve messages.');
    }
  }

  async findAllMessageByUserId(userId: string) {
    try {
      const id = Number(userId);
      const message = await this.prisma.message.findMany({
        where: { id: userId },
      });

      if (message) return message;
      throw new NotFoundException(`Message with id ${userId} not found.`);
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve the message. ${error}`);
    }
  }

  async updateMessageByMessageIdUserID(userId: string, updateMessageDto: UpdateMessageDto) {
    try {
      const { content, messageId } = updateMessageDto;
      
      const id = Number(userId);
      const existingMessage = await this.prisma.message.findFirst({
        where: { id: messageId, userId: id},
      });

      if (!existingMessage)
        throw new NotFoundException(`Message with id ${messageId} not found.`);

      const updatedMessage = await this.prisma.message.update({
        where: { id: messageId, userId: id},
        data: { content },
      });

      return updatedMessage;
    } catch (error) {
      throw new BadRequestException('Failed to update the message.');
    }
  }

  async removeMessageByMessageID(messageId: string) {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId},
      });

      if (!existingMessage) {
        throw new NotFoundException(`Message with id ${messageId} not found.`);
      }

      await this.prisma.message.delete({
        where: { id: messageId },
      });

      return { message: 'Message deleted successfully.' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete the message. Error ${error.message}`);
    }
  }
}
