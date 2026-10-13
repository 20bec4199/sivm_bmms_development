import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Put, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { MaintenancePlansService } from './maintenance-plans.service';
import { CreateMaintenancePlanDto, UpdateMaintenancePlanDto } from './dto/maintenance-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Maintenance Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_WORK')
@Controller('maintenance-plans')
export class MaintenancePlansController {
  constructor(private readonly service: MaintenancePlansService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'MaintenancePlan' })
  @ApiOperation({ summary: 'Create an advanced maintenance plan with checklist templates and automated rules' })
  create(@CurrentUser() user: any, @Body() dto: CreateMaintenancePlanDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all maintenance plans with execution statistics' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a maintenance plan by id with full checklists and history' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'MaintenancePlan' })
  @ApiOperation({ summary: 'Update a maintenance plan and re-sync facility maintenance blocks' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateMaintenancePlanDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Post(':id/generate-work-order')
  @RequirePermissions({ action: 'CREATE', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Trigger automated work order generation from maintenance schedule with idempotency check' })
  generateWorkOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.generateWorkOrder(user.organizationId, id);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'MaintenancePlan' })
  @ApiOperation({ summary: 'Delete a maintenance plan' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
