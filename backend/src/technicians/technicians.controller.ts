import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto, UpdateTechnicianDto } from './dto/create-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Technicians')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('TECHNICIAN')
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly service: TechniciansService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'User' })
  @ApiOperation({ summary: 'Create a technician' })
  create(@CurrentUser() user: any, @Body() dto: CreateTechnicianDto) {
    return this.service.create(user.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'User' })
  @ApiOperation({ summary: 'Get all technicians' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'User' })
  @ApiOperation({ summary: 'Get a single technician' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'User' })
  @ApiOperation({ summary: 'Update a technician' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTechnicianDto) {
    return this.service.update(user.organizationId, user.id, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'User' })
  @ApiOperation({ summary: 'Delete a technician' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, user.id, id);
  }
}
