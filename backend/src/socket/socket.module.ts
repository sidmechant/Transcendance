import { Module, forwardRef } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { ChannelModule } from "../channel/channel.module";

@Module({
	providers: [SocketGateway],
	exports: [SocketGateway],
})

export class SocketModule {}