import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, AlertQueryDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';

@ApiTags('SmartiAlert')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleGuard, PermissionsGuard)
@RequireModule('SMARTI_ALERT')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('broadcast')
  @RequirePermissions({ action: 'CREATE', subject: 'Alert' })
  @ApiOperation({ summary: 'Create and broadcast an alert' })
  async createBroadcast(@Request() req, @Body() dto: CreateAlertDto) {
    const orgId = req.user.organizationId;
    return this.alertsService.createBroadcast(orgId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Alert' })
  @ApiOperation({ summary: 'Get all broadcasted alerts' })
  async findAll(@Request() req, @Query() query: AlertQueryDto) {
    const orgId = req.user.organizationId;
    return this.alertsService.findAll(orgId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Alert' })
  @ApiOperation({ summary: 'Get a specific broadcasted alert' })
  async findOne(@Request() req, @Param('id') id: string) {
    const orgId = req.user.organizationId;
    return this.alertsService.findOne(orgId, id);
  }
}
