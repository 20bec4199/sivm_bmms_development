import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BuildingManagersService } from './building-managers.service';
import { CreateBuildingManagerDto } from './dto/create-building-manager.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Building Managers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('building-managers')
export class BuildingManagersController {
  constructor(private readonly buildingManagersService: BuildingManagersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new building manager' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateBuildingManagerDto,
  ) {
    return this.buildingManagersService.create(user.organizationId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all building managers' })
  findAll(@CurrentUser('organizationId') organizationId: string) {
    return this.buildingManagersService.findAll(organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a building manager' })
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.buildingManagersService.remove(organizationId, id);
  }
}
