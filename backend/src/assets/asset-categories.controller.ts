import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetCategoriesService } from './asset-categories.service';
import { CreateAssetCategoryDto } from './dto/asset-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Asset Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_ASSET')
@Controller('asset-categories')
export class AssetCategoriesController {
  constructor(private readonly service: AssetCategoriesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'AssetCategory' })
  @ApiOperation({ summary: 'Create an asset category' })
  create(@CurrentUser() user: any, @Body() dto: CreateAssetCategoryDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all asset categories' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.organizationId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'AssetCategory' })
  @ApiOperation({ summary: 'Delete an asset category' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
