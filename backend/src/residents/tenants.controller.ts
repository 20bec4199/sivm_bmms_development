import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenants.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Tenant' })
  @ApiOperation({ summary: 'Register a move-in (Create tenant)' })
  create(@CurrentUser() user: any, @Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(user.organizationId, createTenantDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Tenant' })
  @ApiOperation({ summary: 'Get all tenants' })
  findAll(@CurrentUser() user: any, @Query() query: TenantQueryDto) {
    return this.tenantsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Tenant' })
  @ApiOperation({ summary: 'Get tenant by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tenantsService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Tenant' })
  @ApiOperation({ summary: 'Update a tenant' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(user.organizationId, id, updateTenantDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Tenant' })
  @ApiOperation({ summary: 'Register a move-out (Delete tenant)' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tenantsService.remove(user.organizationId, id);
  }
}
