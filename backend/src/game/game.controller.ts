import { Controller,
  Post,
  Param,
  Body,
  Put,
  Get,
  Delete,
  Req,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
  HttpException,
  Patch,
} from '@nestjs/common';
import { GameService } from './game.service';
import { Match } from '@prisma/client';
import { CreateGameDto, UpdateScoreDto } from '../dto/match.dto';
import { JwtAuthGuard } from  '../auth/jwt.guard';
import { PlayersService } from 'src/players/players.service';


@Controller('game')
export class GameController {
  constructor(private readonly playersService: PlayersService, private readonly gameService: GameService) {}

  /**
   * Cette route créé un match.
   * @route POST /game/create
   * @param {CreateGameDto} createGameDto - Les informations nécessaires à la création d'un match. Il contient les ID des joueurs participant au match.
   * @returns {Promise<Match>} La promesse résolue contient le match créé.
   * @throws {InternalServerErrorException} Si une erreur survient lors de la création du match.
   * @example
   * POST /game/create
   * Body: {
   *  "token": 1,
   *  "token1": 2
   * }
   */
  // @UseGuards(JwtAuthGuard)
  // @Post('create')
  // async createGame(@Req() req): Promise<Match> {
  //   try {
  //     const id: number = Number(req.userId);
  //     const id1: number = Number(req.userId1);
  //     return this.gameService.createMatch(id, id1);
  //   } catch (error) {
  //     throw new InternalServerErrorException('Une erreur s\'est produite lors de la création du match.');
  //   }
  // }

  /**
   * Cette route met à jour le score du joueur A dans un match existant.
   * @route PUT /game/updateScore/:matchId/playerA
   * @param {number} matchId - L'ID du match à mettre à jour.
   * @param {UpdateScoreDto} updateScoreDto - Les informations nécessaires à la mise à jour du score du joueur A.
   * @returns {Promise<Match>} La promesse résolue contient le match mis à jour.
   * @throws {NotFoundException} Si le match n'est pas trouvé.
   * @throws {InternalServerErrorException} Si une erreur survient lors de la mise à jour du score.
   * @example
   * PUT /game/updateScore/1/playerA
   * Body: {
   *   "score": 3
   * }
   */
  @UseGuards(JwtAuthGuard)
  @Put('updateScore/playerA')
  async updatePlayerAScore(@Req() req, @Body() updateScoreDto: UpdateScoreDto): Promise<Match> {
    try {
      const id: number = Number(req.userId);
      const match = await this.gameService.updatePlayerAScore(id, Number(updateScoreDto.scoreA));
      if (!match) throw new NotFoundException(`Match with ID ${id} not found`);
      return match;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Une erreur s\'est produite lors de la mise à jour du score du joueur A.');
      }
    }
  }

  /**
   * Cette route met à jour le score du joueur B dans un match existant.
   * @route PUT /game/updateScore/:matchId/playerB
   * @param {number} matchId - L'ID du match à mettre à jour.
   * @param {UpdateScoreDto} updateScoreDto - Les informations nécessaires à la mise à jour du score du joueur B.
   * @returns {Promise<Match>} La promesse résolue contient le match mis à jour.
   * @throws {NotFoundException} Si le match n'est pas trouvé.
   * @throws {InternalServerErrorException} Si une erreur survient lors de la mise à jour du score.
   * @example
   * PUT /game/updateScore/1/playerB
   * Body: {
   *   "score": 2
   * }
   */
  @UseGuards(JwtAuthGuard)
  @Put('updateScore/playerB')
  async updatePlayerBScore(@Req() req, @Body() updateScoreDto: UpdateScoreDto): Promise<Match> {
    try {
      const id: number = Number(req.userId);
      const match = await this.gameService.updatePlayerBScore(id, Number(updateScoreDto.scoreB));
      if (!match) throw new NotFoundException(`Match with ID ${id} not found`);
      return match;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Une erreur s\'est produite lors de la mise à jour du score du joueur B.');
      }
    }
  }

  /**
   * Récupère un match par son ID.
   * @param {number} matchId - L'ID du match à récupérer.
   * @returns {Promise<Match>} La promesse résolue contient le match.
   * @throws {NotFoundException} Si le match n'est pas trouvé.
   */
  @UseGuards(JwtAuthGuard)
  @Get('id')
  async getMatchById(@Req() req): Promise<Match> {
    try {
      const id: number = Number(req.userId);
      const match = await this.gameService.getMatchById(Number(id));
      if (!match) throw new NotFoundException(`Match with ID ${id} not found`);
      return match;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Une erreur s\'est produite lors de la récupération du match par ID.');
      }
    }
  }

  /**
   * Récupère tous les matchs joués par un joueur.
   * @param {number} playerId - L'ID du joueur.
   * @returns {Promise<Match[]>} La promesse résolue contient un tableau de tous les matchs joués par le joueur.
   * @throws {NotFoundException} Si le joueur n'est pas trouvé.
   */
  @UseGuards(JwtAuthGuard)
  @Get('player/matches/:userId')
  async getAllMatchesByPlayerId(@Param('userId') userId: string): Promise<Match[]> {
    try {
      const id: number = Number(userId)
      const matches = await this.gameService.getAllMatchesByPlayerId(id);
      if (!matches || matches.length === 0) throw new NotFoundException(`No matches found for player with ID ${id}`);
      return matches;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Une erreur s\'est produite lors de la récupération des matches du joueur.');
      }
    }
  }

  /**
   * Supprime un match par son ID.
   * @route DELETE /game/:id
   * @param {number} id - L'ID du match à supprimer.
   * @returns {Promise<Match>} La promesse résolue contient le match supprimé.
   * @throws {NotFoundException} Si le match n'est pas trouvé.
   * @throws {InternalServerErrorException} Si une erreur survient lors de la suppression du match.
   * @example
   * DELETE /game/1
   */
  @UseGuards(JwtAuthGuard)
  @Delete('id')
  async deleteMatch(@Req() req): Promise<Match> {
    try {
      const id: number = Number(req.userId);
      const deletedMatch = await this.gameService.deleteMatch(id);
      if (!deletedMatch) throw new NotFoundException(`Match with ID ${id} not found`);
      return deletedMatch;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Une erreur s\'est produite lors de la suppression du match.');
      }
    }
  }


  @UseGuards(JwtAuthGuard)
  @Get('last/:userId')
  async getLastMatches(@Param('userId') userId: string): Promise<any[]> {
	  try {
		  const id: number = Number(userId);
		  const matches = await this.gameService.getLastMatches(id);
		  
		  const transformedMatches = [];
		  for (const match of matches) {
			  const playerA = await this.playersService.getPlayerById(match.playerAId);
			  const playerB = await this.playersService.getPlayerById(match.playerBId);
			  transformedMatches.push({
				  ...match,
				  playerA: playerA.pseudo,
				  playerB: playerB.pseudo
			  });
		  }
		  // console.log(transformedMatches);
		  return transformedMatches;
  
	  } catch (error) {
		  return [];
	  }
  }
  

  @UseGuards(JwtAuthGuard)
  @Patch('updateScore')
  async updatePlayerScores(@Req() req, @Body() updateScoreDto: UpdateScoreDto): Promise<Match> {
    try {
      console.log("Hello la terre ....");
      const id: number = Number(req.userId);
      const match = await this.gameService.updateMatchScores(updateScoreDto.userIdA, updateScoreDto.scoreB, updateScoreDto.scoreA, updateScoreDto.scoreB);
      if (!match) throw new NotFoundException(`Match with ID ${id} not found`);
      return match;
    } catch (error) {
      return ;
    }
  }
}
