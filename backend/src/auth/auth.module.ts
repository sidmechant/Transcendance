import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FortyTwoapiModule } from './forty-twoapi/forty-twoapi.module';
import { Prisma } from '@prisma/client';
import {JwtModule } from '../jwt/jwt.module'
import { PassportModule} from '@nestjs/passport'
import { TwoFactorAuthenticationService } from './two-factor-authentication/two-factor-authentication.service';
import { TwoFactorAuthenticationController } from './two-factor-authentication/two-factor-authentication.controller';
import { FortyTwoApiService } from './forty-twoapi/forty-twoapi.service';
import {  FortyTwoApiController } from './forty-twoapi/forty-twoapi.controller';
import { CrudService } from './forty-twoapi/crud.service'

@Module({ 
  providers: [AuthService, CrudService,FortyTwoApiService, TwoFactorAuthenticationService],
  controllers: [AuthController, FortyTwoApiController, TwoFactorAuthenticationController],
  imports: [FortyTwoapiModule, JwtModule, PassportModule, HttpModule]
})
export class AuthModule {}
