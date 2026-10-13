import { Module } from '@nestjs/common';
import { BuildingManagersService } from './building-managers.service';
import { BuildingManagersController } from './building-managers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BuildingManagersController],
  providers: [BuildingManagersService],
})
export class BuildingManagersModule {}
