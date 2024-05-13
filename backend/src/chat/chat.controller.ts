import {
  Post,
  Get,
  Put,
  Body,
  Req,
  Delete,
  Controller,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Param } from '@nestjs/common';
import { ChannelService } from './chat.service'
import { UpdateChannelDto, SearchChannelByNameDto, UpdateChannelByNameDto } from './chat.dto';
import { PrismaClient, Channel } from '@prisma/client';
import { JwtAuthGuard } from  '../auth/jwt.guard';
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
import { CreateChannelDto } from 'src/dto/channel.dto';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService, private readonly crud: CrudService)
  {}

  /**
   * Crée un nouveau canal.
   * 
   * @route POST /created
   * @group Channels - Opérations concernant les canaux.
   * @param {CreateChannelDto} createChannelDto.body.required - Les données du canal à créer.
   * @returns {Promise<{ statusCode: number, message: string, isSuccess: boolean }>} 201 - Indique que le canal a été créé avec succès.
   * @returns {Promise<{ statusCode: number, message: string, isSuccess: boolean }>} 401 - Indique que l'utilisateur n'est pas autorisé à créer un canal.
   * @returns {Promise<{ statusCode: number, message: string, isSuccess: boolean }>} 400 - Indique une erreur lors de la création du canal.
   * */
  @UseGuards(JwtAuthGuard)
  @Post('created')
  async createChannel(@Body() createChannelDto: CreateChannelDto, @Req() req): Promise<{ statusCode: number, message: string, isSuccess: boolean }> {
    try {
      console.log("je suis createChannel ..... ");
      const id = (req.userId);
      createChannelDto.ownerId = id;
      const newChannel: Channel = await this.channelService.createChannel(createChannelDto);
      console.log("Success create channel", newChannel);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Channel created successfully.',
        isSuccess: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
            statusCode: error.getStatus(),
            message: error.message,
            isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
        isSuccess: false
      }
    }
  }

  /**
   * Cherche un canal par son nom.
   * 
   * @route POST /canaux/search
   * @param {SearchChannelByNameDto} searchChannelDto - DTO contenant le nom du canal.
   * @returns {Promise<any>} - Le canal trouvé ou une réponse d'erreur.
   */
  @UseGuards(JwtAuthGuard)
  @Post('search')
  async findChannelByName(@Body() searchChannelDto: SearchChannelByNameDto): Promise<any> {
    try {
      console.log("je suis findChannelByName ...... ");
      const channel = await this.channelService.findChannelByName(searchChannelDto.name);
      console.log("Sucess findChannrlByName ..... ");
      return {
        statusCode: HttpStatus.FOUND,
        data: channel,
        message: 'Channel retrieved successfully.',
        isSuccess: true
      };
    } catch (error) {
      console.log("DEBUG", error.message);
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      } return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'bad request.',
        isSuccess: false
      };
    }
  }

  /**
  * Récupère tous les canaux possédés par un utilisateur.
  * 
  * @route GET /canaux/user
  * @group Channels - Opérations concernant les canaux.
  * @uses JwtAuthGuard - Assurez-vous que la requête est authentifiée.
  * @returns {Promise<any>} 200 - La liste des canaux ou un message d'erreur.
  */
  @UseGuards(JwtAuthGuard)
  @Get('/channel')
  async getChannelsByUser(@Req() req): Promise<any> {
    try {
      console.log("je suis dans getChannelsByUser ...... ");
      const id: number = Number(req.userId);
      const channels: Channel[] = await this.channelService.getChannelsByUserId(id);
      console.log("Sucess getChannelsByUser ..... ");
      return {
        statusCode: HttpStatus.FOUND,
        data: channels,
        message: 'Channels retrieved successfully.',
        isSuccess: true
      };
    } catch (error) {
        if (error instanceof HttpException) {
          return {
            statusCode: error.getStatus(),
            message: error.message,
            isSuccess: false
          };
        } return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'bad request.',
          isSuccess: false
        };
    }
  }

  /**
   * Récupère la liste de tous les canaux.
   * 
   * @route GET /
   * @group Channels - Opérations concernant les canaux.
   * @returns {Promise<any>} 200 - La liste des canaux ou un message d'erreur.
   */
  @UseGuards(JwtAuthGuard)
  @Get('allChannel')
  async findAll(): Promise<any> {
    try {
      console.log("Je suis findAll ....... ");
      const channels: Channel[] = await this.channelService.findAllChannels();
      const newChannels = channels.filter(elem => elem.type === "public");
      console.log("Sucess findAll ..... ");
      return {
        statusCode: HttpStatus.FOUND,
        data: newChannels,
        message: 'Channels retrieved successfully.',
        isSuccess: true
      };
    } catch (error) {
        if (error instanceof HttpException) {
          return {
            statusCode: error.getStatus(),
            message: error.message,
            isSuccess: false
          };
        } return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'bad request.',
          isSuccess: false
        };
    }
  }

  /**
  * Met à jour un canal en fonction de l'ID de l'utilisateur et du DTO fourni
  * 
  * @route PUT /canaux/id
  * @param {Request} request - L'objet de requête.
  * @param {UpdateChannelDto} updateChannelDto - Données pour mettre à jour le canal.
  * @returns {Promise<Channel>} - Le canal mis à jour.
  * @throws {UnauthorizedException} - Si l'utilisateur n'est pas authentifié ou ne possède pas le canal.
  * @throws {NotFoundException} - Si le canal n'est pas trouvé.
  * @throws {BadRequestException} - Si les données fournies sont incorrectes.
  */
  @UseGuards(JwtAuthGuard)
  @Put('updateById')
  async updateChannel(@Req() req, @Body() updateChannelDto: UpdateChannelDto): Promise<any> {
    try {
      console.log("je suis dans updateChannel ..... ");
      const id = Number(req.userId);
     console.log("Sucess updateChannel ..... ");
      const updatedChannel = await this.channelService.updateChannelByUserId(req.userId, updateChannelDto);

      return {
        statusCode: HttpStatus.OK,
        data: updatedChannel,
        message: 'Channel updated successfully.',
        isSuccess: true
      };
    } catch (error) {
      console.log("DEBUG", error.message);
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        };
      }
    }
  }

 /**
 * Supprime un canal par son nom. L'utilisateur doit être le propriétaire du canal pour effectuer la suppression.
 *
 * @route DELETE /canaux/delete-by-name
 * @param {Request} request - L'objet de requête.
 *
 * @returns {Promise<any>} - Un objet avec le statut de la suppression.
 *
 * @throws {NotFoundException} - Si le canal n'est pas trouvé avec le nom spécifié pour l'utilisateur actuel.
 * @throws {UnauthorizedException} - Si l'utilisateur actuel n'est pas autorisé à supprimer le canal.
 */
  @UseGuards(JwtAuthGuard)
  @Delete('deleteByName')
  async deleteChannelByName(@Req() request): Promise<any> {
    try {
      console.log("Je suis dans deleteChannelByName ...... ", );
      await this.channelService.deleteChannelByNameAndOwnerId(request.query.name, request.userId);
      return {
        statusCode: HttpStatus.OK,
        message: "Delete channel successfully",
        isSuccess: true
      };
    } catch (error) {
      console.log(" DEBUG ", error.message);
      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
          isSuccess: false
        }
      } return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'bad request.',
          isSuccess: false
      };
    }
  }

  /**
   * Supprime tous les canaux de l'utilisateur actuel.
   *
   * @route DELETE /canaux/user/delete-all
   * @param {Request} request - L'objet de requête.
   *
   * @returns {Promise<any>} - Un objet avec le statut de la suppression de tous les canaux de l'utilisateur.
   *
   * @throws {UnauthorizedException} - Si l'utilisateur actuel n'est pas authentifié.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('deleteAll')
  async deleteAllUserChannels(@Req() request): Promise<any> {
    try {
      await this.channelService.deleteAllChannelsByOwnerId(request.userId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Tous les canaux de l\'utilisateur ont été supprimés avec succès.',
        isSuccess: true
      };
    } catch (error) {
      console.log("DEBUG", error.message);
      if (error instanceof HttpException) {
        return {
          statusCode: HttpStatus.NOT_IMPLEMENTED,
          message: error.message,
          isSuccess: true
        }
      }
      return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad request.",
          isSuccess: false
      }
    }
  }

}