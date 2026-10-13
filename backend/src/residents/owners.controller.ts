import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { CreateOwnerDto, UpdateOwnerDto, OwnerQueryDto } from './dto/owners.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Owner' })
  @ApiOperation({ summary: 'Create an owner' })
  create(@CurrentUser() user: any, @Body() createOwnerDto: CreateOwnerDto) {
    return this.ownersService.create(user.organizationId, createOwnerDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Owner' })
  @ApiOperation({ summary: 'Get all owners' })
  findAll(@CurrentUser() user: any, @Query() query: OwnerQueryDto) {
    return this.ownersService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Owner' })
  @ApiOperation({ summary: 'Get owner by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ownersService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Owner' })
  @ApiOperation({ summary: 'Update an owner' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateOwnerDto: UpdateOwnerDto) {
    return this.ownersService.update(user.organizationId, id, updateOwnerDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Owner' })
  @ApiOperation({ summary: 'Delete an owner' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ownersService.remove(user.organizationId, id);
  }
}
