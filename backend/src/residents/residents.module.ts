import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { TenantsController } from './tenants.controller';
import { VehiclesController } from './vehicles.controller';
import { TransfersController } from './transfers.controller';
import { OwnersService } from './owners.service';
import { TenantsService } from './tenants.service';
import { VehiclesService } from './vehicles.service';
import { TransfersService } from './transfers.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OwnersController, TenantsController, VehiclesController, TransfersController],
  providers: [OwnersService, TenantsService, VehiclesService, TransfersService],
  exports: [OwnersService, TenantsService, VehiclesService, TransfersService],
})
export class ResidentsModule {}
