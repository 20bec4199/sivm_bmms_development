import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Role' })
  findAllRoles(@Req() req: AuthenticatedRequest, @Query('orgId') queryOrgId?: string) {
    const targetOrgId = (req.user.isPlatformAdmin && queryOrgId) 
      ? queryOrgId 
      : req.user.organizationId;
    return this.rolesService.findAllRoles(targetOrgId);
  }

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Role' })
  createRole(@Req() req: AuthenticatedRequest, @Body() body: { name: string; description?: string; orgId?: string }) {
    const targetOrgId = (req.user.isPlatformAdmin && body.orgId) 
      ? body.orgId 
      : req.user.organizationId;
    return this.rolesService.createRole(targetOrgId, body.name, body.description);
  }

  @Get('permissions')
  @RequirePermissions({ action: 'READ', subject: 'Role' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post(':id/permissions/:permissionId')
  @RequirePermissions({ action: 'CREATE', subject: 'Role' })
  assignPermission(
    @Req() req: AuthenticatedRequest,
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
    @Query('orgId') queryOrgId?: string
  ) {
    const targetOrgId = (req.user.isPlatformAdmin && queryOrgId) 
      ? queryOrgId 
      : req.user.organizationId;
    return this.rolesService.assignPermissionToRole(targetOrgId, roleId, permissionId, req.user.id);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions({ action: 'DELETE', subject: 'Role' })
  removePermission(
    @Req() req: AuthenticatedRequest,
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
    @Query('orgId') queryOrgId?: string
  ) {
    const targetOrgId = (req.user.isPlatformAdmin && queryOrgId) 
      ? queryOrgId 
      : req.user.organizationId;
    return this.rolesService.removePermissionFromRole(targetOrgId, roleId, permissionId);
  }

  @Post(':id/users/:userId')
  @RequirePermissions({ action: 'CREATE', subject: 'Role' })
  assignRoleToUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @Query('orgId') queryOrgId?: string
  ) {
    const targetOrgId = (req.user.isPlatformAdmin && queryOrgId) 
      ? queryOrgId 
      : req.user.organizationId;
    return this.rolesService.assignRoleToUser(targetOrgId, userId, roleId, req.user.id);
  }

  @Delete(':id/users/:userId')
  @RequirePermissions({ action: 'DELETE', subject: 'Role' })
  removeRoleFromUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @Query('orgId') queryOrgId?: string
  ) {
    const targetOrgId = (req.user.isPlatformAdmin && queryOrgId) 
      ? queryOrgId 
      : req.user.organizationId;
    return this.rolesService.removeRoleFromUser(targetOrgId, userId, roleId);
  }
}
