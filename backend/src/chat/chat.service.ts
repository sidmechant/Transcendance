import { Injectable, ConflictException, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateChannelDto, UpdateChannelDto, SearchChannelByNameDto, UpdateChannelByNameDto } from '../dto/channel.dto';
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaClient, Channel } from '@prisma/client'
import { channel } from 'diagnostics_channel';
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';

@Injectable()
export class ChannelService {
  public readonly ALGORITHM = 'aes-192-cbc';
  private readonly KEY_LENGTH = 24;
  private readonly IV_LENGTH = 16;
  private readonly PASSWORD = process.env.PASSWORD_2FA// Choisissez un mot de passe fort
  private key: Buffer;

  constructor(private readonly prisma: PrismaService) {
    scrypt(this.PASSWORD, 'salt', this.KEY_LENGTH, (err, derivedKey) => {
      if (err) throw err;
      this.key = derivedKey;
    });
  }

  public encrypt(text: string): string {
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  public decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(this.ALGORITHM, this.key, iv);
    const decryptedBuffers = [decipher.update(encryptedText)]; // Retourne un Buffer
    decryptedBuffers.push(decipher.final()); // Ajoute un autre Buffer à notre tableau
    return Buffer.concat(decryptedBuffers).toString('utf8'); // Concatène et convertit en string
  }

  /**
  * Hashes a plain-text password.
  *
  * This function generates a cryptographic salt and then uses that salt
  * to hash the given plain-text password. The bcrypt hashing algorithm
  * is used due to its resistance to brute force and rainbow table attacks.
  *
  * @private
  * @async
  * @function
  * @param {string} password - The plain-text password to hash.
  * @returns {Promise<string>} - Returns a promise that resolves to the hashed password.
  * @throws {Error} - Throws an error if there's an issue during hashing.
  *
  * @example
  * const hashed = await hashPassword("myPlainPassword");
  * console.log(hashed);  // '$2b$10$...<rest of the hash>'
  */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds: number = 10;
    try {
      password = await bcrypt.hash(password, saltRounds);
      console.log("Je suis ici .... ", password);
      return password;
    } catch (err) {
      console.error("Error hashing the password", err);
      throw new Error("Failed to hash the password.");
    }
  }

  /**
  * Compares a plain-text password with a hashed password.
  *
  * This function is used to verify if a given plain-text password
  * matches a previously hashed password. It's essential to use this
  * method instead of a direct string comparison to ensure the security
  * of the hashed password.
  *
  * @private
  * @async
  * @function
  * @param {string} inputPassword - The plain-text password to verify.
  * @param {string} hashedPassword - The hashed password to compare against.
  * @returns {Promise<boolean>} - Returns a promise that resolves to `true` if the passwords match, otherwise `false`.
  * @throws {Error} - Throws an error if there's an issue during comparison.
  *
  * @example
  * const isValid = await checkPassword("myPlainPassword", '$2b$10$...<rest of the hash>');
  * console.log(isValid);  // true or false
  */
  private async checkPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(inputPassword, hashedPassword);
    } catch (err) {
      console.error("Error comparing the passwords", err);
      throw new Error("Failed to compare the passwords.");
    }
  }

  async findChannelByname(name: string, userId: number) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        ownerId: userId,
        name: name,
      },
    });
    if (channel) return channel;
    throw new HttpException('cannal exist', HttpStatus.CONFLICT);
  }

  /*
    Il va falloir envoyer l'ornerId par le bias du jwtguard 
  */
  /**
  * Crée un nouveau canal.
  * 
  * @param createChannelDto - DTO contenant les informations pour créer un nouveau canal.
  * @returns {Promise<Channel>} - Le canal nouvellement créé.
  * @throws {ConflictException} - Lancée si le nom du canal existe déjà.
  * @throws {BadRequestException} - Lancée si un canal privé est créé sans mot de passe.
  */
  async createChannel(createChannelDto: CreateChannelDto): Promise<Channel> {
    try {
      const { name, type, ownerId, password } = createChannelDto;

      const id = Number(ownerId);
      const existingChannel: Channel = await this.findChannelByname(name, id);;
      if (existingChannel)
        throw new HttpException('cannal exist', HttpStatus.CONFLICT);

      if (type === 'protected' && !password)
        throw new HttpException('password not found', HttpStatus.BAD_REQUEST);

      const hashedPassword: string = type === 'protected' ? await this.encrypt(password) : null;

      const channel: Channel = await this.prisma.channel.create({
        data: {
          name,
          type,
          ownerId: id,
          password: hashedPassword
        }
      });
      if (channel) return channel;
      throw new HttpException("cannal don't create", HttpStatus.NOT_IMPLEMENTED)
    } catch (error) {
      throw error;
    }
  }

  /**
  * Cherche un canal par son nom.
  * 
  * @param {string} name - Le nom du canal.
  * @returns {Promise<Channel | null>} - Le canal trouvé ou null.
  */
  async findChannelByName(name: string): Promise<Channel | null> {
    try {
      //console.log("je suis dans findChannelByName");
      const channel: Channel = await this.prisma.channel.findUnique({
        where: {
          name: name,
        },
      });
      if (channel) return channel;
      throw new HttpException(`Channel ${name} not found`, HttpStatus.NOT_FOUND);;
    } catch (error) {
      throw error;
    }
  }

  /**
  * Récupère la liste de tous les canaux.
  *
  * @returns {Promise<Channel[]>} La liste des canaux.
  * @throws {NotFoundException} Si aucun canal n'est trouvé.
  */
  public async findAllChannels(): Promise<Channel[]> {
    try {
      //console.log("je suis dans findAllChannels");
      const channels = await this.prisma.channel.findMany();
      if (channels.length > 0)
        return channels.map(channel => ({ ...channel, password: null }));
      throw new HttpException(`Channels not found`, HttpStatus.NOT_FOUND);;
    } catch (error) {
      throw error;
    }
  }

  /**
  * Récupère tous les canaux associés à utilisateur.
  * @param userId L'ID de l'utilisateur.
  * @returns { Promise<Channel[]> } La liste des canaux associés à l'utilisateur.
  * @throws { NotFoundException } Si aucun canal n'est trouvé.
  */
  async findChannelsByUserId(userId: number): Promise<Channel[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { ownedChannels: true }
      });
      if (!user || user.ownedChannels.length === 0)
        throw new HttpException(`Channels not found`, HttpStatus.NOT_FOUND);;
    return user.ownedChannels;
    } catch (error) {
      throw error;
    }
  }

  /**
  * Récupère tous les canaux possédés par un utilisateur.
  * @param userId L'ID de l'utilisateur.
  * @returns {Promise<Channel[]>} La liste des canaux.
  * @throws {NotFoundException} Si aucun canal n'est trouvé pour cet utilisateur.
  */
  async getChannelsByUserId(userId: number): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: { ownerId: userId }
      });
      if (channels.length) return channels;
      throw new HttpException(`Channels not found`, HttpStatus.NOT_FOUND);;
    } catch (error) {
      throw error;
    }
  }

  diffChannel(channel: any, newChannel: UpdateChannelDto): boolean {
    if (channel.ownerId === newChannel.newownerId
      && channel.type === newChannel.newtype
      && channel.password === newChannel.newpassword
      && channel.name === newChannel.newname) {
      return true;
    } else if (!newChannel.newpassword
      && !newChannel.newownerId
      && !newChannel.newname
      && !newChannel.newtype) {
      return true;
    }
    return false;
  }

  updatePassword(channel: UpdateChannelDto, password: string, type: string): string {
    if (type === "protected" && password) {
      channel.newpassword = this.encrypt(password);
      return channel.newpassword;
    } else if (type === "public" || type === "private")
      return "";
    throw new BadRequestException('Un mot de passe est requis pour les canaux privés.');
  }

  updateType(channel: UpdateChannelDto, type: string): string {
    if (type === "protected" && channel.newpassword) {
      channel.newpassword = this.encrypt(channel.newpassword);
      console.log("Je suis ici maintenant .... ", channel.newpassword);
      return type;
    } else if (type === "private" || type === "public") {
      channel.newpassword = "";
      return type;
    }
    throw new HttpException('Not password', HttpStatus.BAD_REQUEST);
  }

  updateChannel(channel: any, newchannelDto: UpdateChannelDto): Channel {
    if (this.diffChannel(channel, newchannelDto))
      throw new HttpException('Not Modified', HttpStatus.NOT_MODIFIED);
    let newChannel: any = {}
    newChannel.type = newchannelDto.newtype ? this.updateType(newchannelDto, newchannelDto.newtype) : null;
    newChannel.name = newchannelDto.newname ? newchannelDto.newname : channel.name;
    newChannel.password = newchannelDto.newpassword ? this.updatePassword(newchannelDto, newchannelDto.newpassword, channel.type) : channel.password;
    newChannel.ownerId = newchannelDto.newownerId ? Number(newchannelDto.newownerId) : channel.ownerId;
    return newChannel;
  }

  /**
  * Met à jour un canal en fonction de l'ID de l'utilisateur et du DTO fourni.
  * 
  * @param {number} userId - ID de l'utilisateur.
  * @param {UpdateChannelDto} data - Données pour mettre à jour le canal.
  * @returns {Promise<Channel>} - Le canal mis à jour.
  * @throws {UnauthorizedException} - Si l'utilisateur ne possède pas le canal.
  * @throws {NotFoundException} - Si le canal n'est pas trouvé.
  */
  async updateChannelByUserId(userId: number, data: UpdateChannelDto): Promise<Channel> {
    try {
      const channel = await this.findChannelByname(data.name, userId);
      const newChannel: any = this.updateChannel(channel, data);
      return this.prisma.channel.update({
        where: { id: channel.id },
        data: newChannel,
      });
    } catch (error) {
      if (error instanceof HttpException)
        throw error;
      throw new HttpException("Not modified", HttpStatus.NOT_MODIFIED);
    }
  }

  /**
  * Supprime un canal en fonction de son nom et de l'ID du propriétaire.
  *
  * @param {string} name - Le nom du canal à supprimer.
  * @param {number} userId - L'ID de l'utilisateur propriétaire du canal.
  *
  * @returns {Promise<void>} - Ne retourne rien si la suppression est réussie.
  *
  * @throws {NotFoundException} - Si aucun canal n'est trouvé avec le nom pour le propriétaire spécifié.
  */
  async deleteChannelByNameAndOwnerId(name: string, userId: number): Promise<void> {
    const channel = await this.prisma.channel.findFirst({
      where: {
        name: name,
        ownerId: userId,
      },
    });

    if (!channel) {
      throw new NotFoundException(`Aucun canal trouvé avec le nom ${name} pour l'utilisateur avec l'ID ${userId}`);
    }

    await this.prisma.channel.delete({
      where: { id: channel.id },
    });
  }


  /**
  * Supprime tous les canaux de l'utilisateur en fonction de son ID.
  *
  * @param {number} userId - L'ID de l'utilisateur dont les canaux doivent être supprimés.
  *
  * @throws {UnauthorizedException} - Si l'utilisateur n'est pas autorisé à supprimer les canaux.
  */
  async deleteAllChannelsByOwnerId(userId: number): Promise<void> {
    const channels = await this.prisma.channel.findMany({
      where: {
        ownerId: userId,
      },
    });

    if (!channels || channels.length === 0) {
      throw new NotFoundException('Aucun canal trouvé pour cet utilisateur.');
    }

    for (const channel of channels) {
      await this.prisma.channel.delete({
        where: { id: channel.id },
      });
    }
  }
}