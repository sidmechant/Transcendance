import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway'; // Mettez à jour le chemin d'importation en fonction de la structure de votre projet
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PlayersService } from '../players/players.service';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
import { Room } from './Room';

@Module({
  providers: [GameGateway, GameService, PlayersService, CrudService, Room],
  controllers: [GameController],
})

export class GameModule {}
