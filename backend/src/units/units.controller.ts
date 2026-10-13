import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitQueryDto } from './dto/unit-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Property' })
  @ApiOperation({ summary: 'Create a unit' })
  create(@CurrentUser() user: any, @Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(user.organizationId, createUnitDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get all units with pagination, property/block filter, type, status, and search' })
  findAll(@CurrentUser() user: any, @Query() query: UnitQueryDto) {
    return this.unitsService.findAll(user.organizationId, query, user);
  }

  @Get('my-units')
  @ApiOperation({ summary: 'Get all units assigned to the logged-in resident' })
  findMyUnits(@CurrentUser() user: any) {
    return this.unitsService.findResidentUnits(user);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get a single unit by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.unitsService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Property' })
  @ApiOperation({ summary: 'Update a unit' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(user.organizationId, id, updateUnitDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Property' })
  @ApiOperation({ summary: 'Delete a unit' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.unitsService.remove(user.organizationId, id);
  }
}
