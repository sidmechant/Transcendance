import { HttpModule } from "@nestjs/axios";
import { Module } from '@nestjs/common';
import { FortyTwoApiService } from './forty-twoapi.service';
import { FortyTwoApiController } from './forty-twoapi.controller';
import { CrudService } from './crud.service'
// import {JwtModule } from '@nestjs/jwt'
import {JwtStrategy} from '../../jwt/JwtStrategy'
import {JwtModule} from '../../jwt/jwt.module'

@Module({
  imports: [HttpModule, JwtModule],
  providers: [FortyTwoApiService, CrudService, JwtStrategy],
  controllers: [FortyTwoApiController]
})
export class FortyTwoapiModule {}
