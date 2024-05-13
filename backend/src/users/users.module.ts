import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '../jwt/jwt.module'; // Adjust the path as necessary

@Module({
  imports: [JwtModule],
  controllers: [UsersController],
  providers: [UsersService], // JwtStrategy is now provided via JwtModule
})
export class UsersModule {}
