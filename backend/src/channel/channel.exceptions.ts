// exceptions/ConversationExists.ts
import { HttpException, HttpStatus } from '@nestjs/common';


export class channelExistsException extends HttpException {
  constructor() {
    super('Channel already exists', HttpStatus.BAD_REQUEST);
  }
}

export class channelNotFoundException extends HttpException {
  constructor() {
    super('Channel not found', HttpStatus.NOT_FOUND);
  }
}

export class CreatechannelException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
