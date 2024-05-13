import { IsInt, Min} from 'class-validator';

/**
 * DTO pour la création d'un match.
 * 
 * @example
 * {
 *   "playerAId": idDuUser,
 *   "playerBId": IdDuUser
 * }
 */
export class CreateGameDto { 
    @IsInt()
    playerAId: number;
    
    @IsInt()
    playerBId: number;
}

/**
 * DTO (Data Transfer Object) pour la mise à jour du score d'un joueur.
 * Le nouveau score du joueur.
 * @type {number}
 * @example 
 * {
 *  "score": "3"
 * }
 */
export class UpdateScoreDto {
  @IsInt()
  @Min(0)
  scoreA: number;
  
  @IsInt()
  @Min(0)
  scoreB: number;
  
  @IsInt()
  @Min(0)
  userIdA: number;
  
  @IsInt()
  @Min(0)
  userIdB: number;
}