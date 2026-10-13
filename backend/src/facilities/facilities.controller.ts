import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto, UpdateFacilityDto, FacilityQueryDto } from './dto/facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_FACILITY')
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly service: FacilitiesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Facility' })
  @ApiOperation({ summary: 'Create a new facility' })
  create(@CurrentUser() user: any, @Body() dto: CreateFacilityDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get('reports/usage')
  @RequirePermissions({ action: 'READ', subject: 'Facility' })
  @ApiOperation({ summary: 'Get facility usage reports' })
  getUsageReports(@CurrentUser() user: any) {
    return this.service.getUsageReports(user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and get facilities' })
  findAll(@CurrentUser() user: any, @Query() query: FacilityQueryDto) {
    return this.service.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Facility' })
  @ApiOperation({ summary: 'Update facility' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Facility' })
  @ApiOperation({ summary: 'Delete facility' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
