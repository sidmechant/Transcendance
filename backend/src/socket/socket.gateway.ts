import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";
import { NewMessageDTO } from "./socket.dto";
import { Channel } from "@prisma/client";
import { PrismaService } from '../../prisma/prisma.service'

interface ISendEvent {
	target: string,
	type: string,
	content: string,
	room?: number,
	data?: any,
	userId?: number,
}

/*interface ChannelOptions {
	banned: string[], //liste des ID des bannis
	muted: string[], //liste des ID des muted
	admin: string[], //list des ID des admin
}*/

interface UserRights {
	admin?: boolean;
	muted?: boolean;
	banned?: boolean;
}

interface ChannelOptions {
	[userId: string]: UserRights;
}

interface ChannelOptionsDto {
	channelId: string,
	userId: number,
}

@WebSocketGateway({

    cors: {
        origin: '*'
    },
})

export class SocketGateway {
	constructor(private readonly prisma: PrismaService) {}
	@WebSocketServer()
    io: Server;

	private userList: Map<number, any> = new Map();
	private channels: { [channelId: string]: ChannelOptions } = {};
	
	@SubscribeMessage('helloworld')
	handleHello(@ConnectedSocket() client: Socket, @MessageBody() msg: string) {
		console.log(`Connected with ID: ${client.id}`);
  		console.log(`socket hello world: ${msg}`);
	}

	@SubscribeMessage('joinChannel')
	handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
		client.join(channelId);
		this.io.to(channelId).emit('updateChannel', this.channels[channelId]);
		console.log("client joined room: ", channelId);
		// console.log(this.channels[channelId]);
	}

	@SubscribeMessage('leaveChannel')
	handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
		client.leave(channelId);
		//console.log("client left room: ", channelId);
	}

	@SubscribeMessage('sendEventRoomInclude')
	handleSendEventRoomInclude(@MessageBody() payload: ISendEvent, @ConnectedSocket() client: Socket) {

		this.io.to(payload.target).emit('newEvent', payload);
	}

	@SubscribeMessage('sendEventRoom')
	handleSendEventRoom(@MessageBody() payload: ISendEvent, @ConnectedSocket() client: Socket) {

		client.broadcast.to(payload.target).emit('newEvent', payload);
	}

	
	@SubscribeMessage('sendEventMessage')
	async handleSendEventMessage(@MessageBody() payload: ISendEvent) {


		try {
			const channel = await this.prisma.channel.findUnique({
			  where: {
				id: payload.target,
			  },
			  include: {
				members: {
				  select: {
					user: {
					  select: {
						player: true
					  }
					}
				  }
				}
			  }
			});
	  
			if (!channel) {
			  throw new Error('send event msg: Channel not found');
			}
	  
			const Playerlist = channel.members.map(member => member.user.player).filter(player => player);
		
			for (const player of Playerlist) {
				const target = this.userList.get(Number(player.id));
				this.io.to(target).emit('newEvent', payload);
			}

		//const target = this.userList.get(Number(payload.target));
		//this.io.to(target).emit('newEvent', payload);
		} catch (error) {
			//console.log("SEND EVENT MSG: ", error);
		}
	}

	@SubscribeMessage('sendEvent')
	handleSendEvent(@MessageBody() payload: ISendEvent) {

		const target = this.userList.get(Number(payload.target));
		this.io.to(target).emit('newEvent', payload);
	}

	@SubscribeMessage('messageSubmit')
	handleMessageSubmit(@MessageBody() name: string) {
		console.log(`${name} sent a message`);
	}

	@OnEvent('newMessage')
	handleSendMessage(@MessageBody() payload: NewMessageDTO) {

		this.io.to(payload.channelId).emit('newMessage', payload);
	}

	@OnEvent('newChannel')
	handleNewChannel(@MessageBody() payload: Channel) {
		this.io.emit('newChannel', payload);
	}

	@SubscribeMessage('getConnection')
	handleGetConnection(@ConnectedSocket() client: Socket) {

		const list: number[] = Array.from(this.userList.keys());
		this.io.to(client.id).emit('updateConnection', list);
	}

	@OnEvent('updateConnection')
	handleUpdateConnection(@MessageBody() userIdList: Map<number, any>) {

		this.userList = userIdList;
		const list: number[] = Array.from(this.userList.keys());
		this.io.emit('updateConnection', list);
	}




	///////////////////////////////////////////////////////////////////

	@OnEvent('addAdmin')
	handleAddAdmin(@MessageBody() payload: ChannelOptionsDto) {
		
		if (!this.channels) {
			this.channels = {};
		}
	
		if (!this.channels[payload.channelId]) {
			this.channels[payload.channelId] = {};
		}
	
		if (!this.channels[payload.channelId][payload.userId]) {
			this.channels[payload.channelId][payload.userId] = {
				admin: false,
				muted: false,
				banned: false,
			};
		}

		this.channels[payload.channelId][payload.userId].admin = true;
		this.io.to(payload.channelId).emit('updateChannel', this.channels[payload.channelId]);
	}

	

	@OnEvent('removeAdmin')
	handleRemoveAdmin(@MessageBody() payload: ChannelOptionsDto) {

		if (!this.channels)
			return ;

		if (!this.channels[payload.channelId])
			return ;
		if (this.channels[payload.channelId][payload.userId]) {
			if (this.channels[payload.channelId][payload.userId].admin === true) {
				this.channels[payload.channelId][payload.userId].admin = false;
				this.io.to(payload.channelId).emit('updateChannel', this.channels[payload.channelId]);
			}
		}
	}

	private removeMutedStatus(payload: ChannelOptionsDto) {
		if (this.channels[payload.channelId] && this.channels[payload.channelId][payload.userId]) {
		  this.channels[payload.channelId][payload.userId].muted = false;
		  this.io.to(payload.channelId).emit('updateChannel', this.channels[payload.channelId]);
		}
	  }
	
	  @OnEvent('addMuted')
	  handleAddMuted(@MessageBody() payload: ChannelOptionsDto) {

		if (!this.channels)
			this.channels = {};
		if (!this.channels[payload.channelId]) {
		  this.channels[payload.channelId] = {};
		}
	
		if (!this.channels[payload.channelId][payload.userId]) {
		  this.channels[payload.channelId][payload.userId] = {};
		}
	
		this.channels[payload.channelId][payload.userId].muted = true;
		this.io.to(payload.channelId).emit('updateChannel', this.channels[payload.channelId]);
	
		setTimeout(() => {
		  this.removeMutedStatus(payload);
		},  60 * 1000); 
	  }
	
	  @OnEvent('removeMuted')
	  handleRemoveMuted(@MessageBody() payload: ChannelOptionsDto) {
		this.removeMutedStatus(payload);
	  }



	@OnEvent('userRemoved')
	handleUserRemoved(@MessageBody() payload: { channelId: string, userId: number }) {

		if (!this.channels)
			return ;
		if (!this.channels[payload.channelId]) {
		return;
		}
		
		delete this.channels[payload.channelId][payload.userId];
		this.io.to(payload.channelId).emit('kick', payload);
	}


  @OnEvent('setBan')
  handleSetBan(@MessageBody() payload: { channelId: string, userId: number, isBanned: boolean }) {
	
	if (!this.channels)
		this.channels = {};
    if (!this.channels[payload.channelId]) {
      this.channels[payload.channelId] = {};
    }

    if (!this.channels[payload.channelId][payload.userId]) {
      this.channels[payload.channelId][payload.userId] = {};
    }
    
  
    this.channels[payload.channelId][payload.userId].banned = payload.isBanned;
    this.io.to(payload.channelId).emit('ban', payload); 
	}

	@OnEvent('removeAdmin')
	handleRemoveBan(@MessageBody() payload: ChannelOptionsDto) {

		if (!this.channels)
			return ;
		if (!this.channels[payload.channelId])
			return ;
		if (this.channels[payload.channelId][payload.userId]) {
			if (this.channels[payload.channelId][payload.userId].admin === true) {
				this.channels[payload.channelId][payload.userId].admin = false;
				this.io.to(payload.channelId).emit('removeBan', this.channels[payload.channelId]);
			}
		}
	}
}