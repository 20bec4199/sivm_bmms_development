import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Property' })
  @ApiOperation({ summary: 'Create a property' })
  create(@CurrentUser() user: any, @Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(user.organizationId, createPropertyDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get all properties with pagination and search' })
  findAll(@CurrentUser() user: any, @Query() query: PropertyQueryDto) {
    return this.propertiesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get a single property by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.propertiesService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Property' })
  @ApiOperation({ summary: 'Update a property' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(user.organizationId, id, updatePropertyDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Property' })
  @ApiOperation({ summary: 'Delete a property' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.propertiesService.remove(user.organizationId, id);
  }
}
