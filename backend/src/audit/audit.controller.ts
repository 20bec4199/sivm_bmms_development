import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Audit & Activity Logs')
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('activities')
  @RequirePermissions({ action: 'READ', subject: 'AuditLog' })
  @ApiOperation({ summary: 'Get paginated activity & audit logs with filters and RBAC isolation' })
  async getActivities(@Request() req: any, @Query() query: any) {
    return this.auditService.findAll(req.user, query);
  }

  @Get('stats')
  @RequirePermissions({ action: 'READ', subject: 'AuditLog' })
  @ApiOperation({ summary: 'Get interactive analytical charts & KPIs for platform activities' })
  async getStats(@Request() req: any, @Query() query: any) {
    return this.auditService.getPlatformActivityStats(req.user, query);
  }

  @Get('organizations/:id/health')
  @RequirePermissions({ action: 'READ', subject: 'AuditLog' })
  @ApiOperation({ summary: 'Get deep health metrics, resource counts, and system alerts for an organization' })
  async getOrgHealth(@Param('id') id: string, @Request() req: any) {
    return this.auditService.getOrganizationHealth(id, req.user);
  }

  @Post('log')
  @RequirePermissions({ action: 'CREATE', subject: 'AuditLog' })
  @ApiOperation({ summary: 'Manually record an activity event (internal or custom)' })
  async createLog(@Body() body: any, @Request() req: any) {
    return this.auditService.logActivity({
      ...body,
      userId: body.userId || req.user?.id,
      userName: body.userName || req.user?.email,
      userRole: body.userRole || req.user?.roles?.[0] || 'USER',
      organizationId: body.organizationId || req.user?.organizationId,
    });
  }
}
