import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';

@Module({
  providers: [PlayersService, PrismaService, CrudService],
  controllers: [PlayersController],
  exports: [PlayersService], 
})
export class PlayersModule {}