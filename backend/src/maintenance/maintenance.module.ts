import { Module } from '@nestjs/common';
import { MaintenancePlansService } from './maintenance-plans.service';
import { MaintenancePlansController } from './maintenance-plans.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersController } from './work-orders.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MaintenancePlansController, WorkOrdersController],
  providers: [MaintenancePlansService, WorkOrdersService],
  exports: [MaintenancePlansService, WorkOrdersService],
})
export class MaintenanceModule {}
