import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FloorsService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Floors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Property' })
  @ApiOperation({ summary: 'Create a new floor' })
  create(@CurrentUser() user: any, @Body() createFloorDto: CreateFloorDto) {
    return this.floorsService.create(user.organizationId, createFloorDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get all floors' })
  findAll(@CurrentUser() user: any, @Query('towerId') towerId?: string) {
    return this.floorsService.findAll(user.organizationId, towerId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get a single floor by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.floorsService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Property' })
  @ApiOperation({ summary: 'Update a floor' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateFloorDto: UpdateFloorDto) {
    return this.floorsService.update(user.organizationId, id, updateFloorDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Property' })
  @ApiOperation({ summary: 'Delete a floor' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.floorsService.remove(user.organizationId, id);
  }
}
