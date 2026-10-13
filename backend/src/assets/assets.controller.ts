import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto } from './dto/asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_ASSET')
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Asset' })
  @ApiOperation({ summary: 'Create a new asset' })
  create(@CurrentUser() user: any, @Body() dto: CreateAssetDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get('alerts/warranty')
  @RequirePermissions({ action: 'READ', subject: 'Asset' })
  @ApiOperation({ summary: 'Get assets with warranties expiring within 30 days' })
  getWarrantyAlerts(@CurrentUser() user: any) {
    return this.service.getWarrantyAlerts(user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and get assets' })
  findAll(@CurrentUser() user: any, @Query() query: AssetQueryDto) {
    return this.service.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Asset' })
  @ApiOperation({ summary: 'Update an asset' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Asset' })
  @ApiOperation({ summary: 'Delete an asset' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
