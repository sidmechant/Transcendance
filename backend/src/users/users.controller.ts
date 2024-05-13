import { Controller, Get, Body, Param, Req, Delete, UseGuards} from '@nestjs/common';
import { UsersService } from './users.service';
import {JwtAuthGuard} from 'src/auth/jwt.guard';
import { Request } from 'express'
import { Public } from 'src/auth/public.decorator';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @UseGuards(JwtAuthGuard)
  @Get('me')
  getUserFromId(@Req() req) {
    return this.usersService.findOne(req.userId);
  }

 @UseGuards(JwtAuthGuard)
  @Get('id')
  getMyUSer(@Body() { id }: { id: number }, req: Request){
    return this.usersService.getMyUsers(id, req)
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  getUsers() {
    return this.usersService.getUsers()
  }

  // @UseGuards(JwtAuthGuard)
  @Delete('deleted')
  @Public()
  ClearUsers() {
    return this.usersService.clearAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('pseudo')
  GetMyUserbypseudo(){
    
  }

}
