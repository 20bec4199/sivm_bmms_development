import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { CreateIncidentDto, UpdateIncidentDto, IncidentQueryDto } from './dto/incident.dto';
import { CreatePatrolRouteDto, LogPatrolDto } from './dto/patrol.dto';
import {
  CreateSecurityPostAssignmentDto,
  CreateSecurityPostDto,
  UpdateSecurityPostAssignmentDto,
  UpdateSecurityPostDto,
} from './dto/security-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  private assertDeploymentAdmin(user: any) {
    const roles = (user.roles ?? []).map((role: any) =>
      typeof role === 'string' ? role.toUpperCase() : role?.name?.toUpperCase(),
    );
    if (!user.isPlatformAdmin && !roles.some((role: string) => ['ORGANIZATION_ADMIN', 'SECURITY_MANAGER'].includes(role))) {
      throw new ForbiddenException('Only organization administrators or security managers can manage security deployment.');
    }
  }

  @Get('posts')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'List configurable security posts and guard assignments' })
  getSecurityPosts(@CurrentUser() user: any) {
    this.assertDeploymentAdmin(user);
    return this.securityService.getSecurityPosts(user.organizationId);
  }

  @Post('posts')
  @RequirePermissions({ action: 'CREATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Create a customizable security post' })
  createSecurityPost(@CurrentUser() user: any, @Body() dto: CreateSecurityPostDto) {
    this.assertDeploymentAdmin(user);
    return this.securityService.createSecurityPost(user.organizationId, dto);
  }

  @Patch('posts/:id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Update or deactivate a security post' })
  updateSecurityPost(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateSecurityPostDto) {
    this.assertDeploymentAdmin(user);
    return this.securityService.updateSecurityPost(user.organizationId, id, dto);
  }

  @Post('posts/:postId/assignments')
  @RequirePermissions({ action: 'CREATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Assign a guard and shift to a security post' })
  assignGuardToPost(
    @CurrentUser() user: any,
    @Param('postId') postId: string,
    @Body() dto: CreateSecurityPostAssignmentDto,
  ) {
    this.assertDeploymentAdmin(user);
    return this.securityService.assignGuardToPost(user.organizationId, postId, user.id, dto);
  }

  @Patch('post-assignments/:id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Update a guard post assignment or deactivate it' })
  updatePostAssignment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSecurityPostAssignmentDto,
  ) {
    this.assertDeploymentAdmin(user);
    return this.securityService.updatePostAssignment(user.organizationId, id, dto);
  }

  @Delete('post-assignments/:id')
  @RequirePermissions({ action: 'DELETE', subject: 'Incident' })
  @ApiOperation({ summary: 'Remove a guard from a security post' })
  removePostAssignment(@CurrentUser() user: any, @Param('id') id: string) {
    this.assertDeploymentAdmin(user);
    return this.securityService.removePostAssignment(user.organizationId, id);
  }

  @Get('my-posts')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'Get the current guard\'s assigned security posts' })
  getMyAssignedPosts(@CurrentUser() user: any) {
    return this.securityService.getMyAssignedPosts(user.organizationId, user.id);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  @Get('dashboard/stats')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'Security dashboard — stats, recent incidents, access events' })
  getDashboardStats(@CurrentUser() user: any) {
    return this.securityService.getDashboardStats(user.organizationId);
  }

  // ─── Incidents ────────────────────────────────────────────────────────────────

  @Post('incidents')
  @RequirePermissions({ action: 'CREATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Report a new security incident' })
  createIncident(@CurrentUser() user: any, @Body() dto: CreateIncidentDto) {
    return this.securityService.createIncident(user.organizationId, user.id, dto);
  }

  @Get('incidents')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'List all incidents (with filters)' })
  findAllIncidents(@CurrentUser() user: any, @Query() query: IncidentQueryDto) {
    return this.securityService.findAllIncidents(user.organizationId, query);
  }

  @Get('incidents/:id')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'Get incident detail' })
  findOneIncident(@CurrentUser() user: any, @Param('id') id: string) {
    return this.securityService.findOneIncident(user.organizationId, id);
  }

  @Patch('incidents/:id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Update incident status or details' })
  updateIncident(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
  ) {
    return this.securityService.updateIncident(user.organizationId, id, dto);
  }

  // ─── Patrol Routes ────────────────────────────────────────────────────────────

  @Post('patrol-routes')
  @RequirePermissions({ action: 'CREATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Create a patrol route with checkpoints' })
  createPatrolRoute(@CurrentUser() user: any, @Body() dto: CreatePatrolRouteDto) {
    return this.securityService.createPatrolRoute(user.organizationId, dto);
  }

  @Get('patrol-routes')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'List all patrol routes' })
  findAllPatrolRoutes(@CurrentUser() user: any) {
    return this.securityService.findAllPatrolRoutes(user.organizationId);
  }

  @Get('patrol-routes/:id')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'Get patrol route with checkpoint last-scan status' })
  findOnePatrolRoute(@CurrentUser() user: any, @Param('id') id: string) {
    return this.securityService.findOnePatrolRoute(user.organizationId, id);
  }

  @Patch('patrol-routes/:id/toggle')
  @RequirePermissions({ action: 'UPDATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Activate / deactivate a patrol route' })
  togglePatrolRoute(@CurrentUser() user: any, @Param('id') id: string) {
    return this.securityService.togglePatrolRoute(user.organizationId, id);
  }

  // ─── Patrol Logs (Guard checkpoint scanning) ──────────────────────────────────

  @Post('patrol-logs')
  @RequirePermissions({ action: 'CREATE', subject: 'Incident' })
  @ApiOperation({ summary: 'Guard logs a checkpoint scan during patrol' })
  logCheckpoint(@CurrentUser() user: any, @Body() dto: LogPatrolDto) {
    return this.securityService.logPatrolCheckpoint(user.id, user.organizationId, dto);
  }

  @Get('patrol-logs')
  @RequirePermissions({ action: 'READ', subject: 'Incident' })
  @ApiOperation({ summary: 'Get patrol logs (filter by route or guard)' })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'guardId', required: false })
  getPatrolLogs(
    @CurrentUser() user: any,
    @Query('routeId') routeId?: string,
    @Query('guardId') guardId?: string,
  ) {
    return this.securityService.getPatrolLogs(user.organizationId, routeId, guardId);
  }

  // ─── Access Log ───────────────────────────────────────────────────────────────

  @Get('access-log')
  @RequirePermissions({ action: 'READ', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Visitor entry/exit log for security desk' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'ISO date string e.g. 2025-01-15' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  getAccessLog(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('date') date?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.securityService.getAccessLog(user.organizationId, {
      search,
      date,
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 30,
    });
  }
}
