import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service'; // Ajustez le chemin d'importation selon votre structure de dossier
import { JwtStrategy } from './JwtStrategy'; // Ajustez le chemin d'importation selon votre structure de dossier
import { CrudService } from 'src/auth/forty-twoapi/crud.service';
import { JwtAuthGuard} from 'src/auth/jwt.guard';
@Module({
  providers: [JwtService, JwtStrategy, CrudService,JwtAuthGuard], // Ajoutez JwtStrategy aux fournisseurs
  exports: [JwtService, JwtStrategy, CrudService, JwtAuthGuard], // Exportez également JwtStrategy
})
export class JwtModule {}
