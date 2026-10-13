import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Vehicle' })
  @ApiOperation({ summary: 'Register and assign a vehicle to a unit' })
  create(@CurrentUser() user: any, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(user.organizationId, createVehicleDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Vehicle' })
  @ApiOperation({ summary: 'Get all vehicles' })
  findAll(@CurrentUser() user: any, @Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Vehicle' })
  @ApiOperation({ summary: 'Get vehicle by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Vehicle' })
  @ApiOperation({ summary: 'Update a vehicle' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(user.organizationId, id, updateVehicleDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Vehicle' })
  @ApiOperation({ summary: 'Delete a vehicle' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vehiclesService.remove(user.organizationId, id);
  }
}
