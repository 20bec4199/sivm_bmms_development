import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { AssignPropertiesDto } from './dto/assign-properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.organizationId, user.id);
  }

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'User' })
  @ApiOperation({ summary: 'Create a new user' })
  create(@CurrentUser() user: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(user.organizationId, user.id, createUserDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'User' })
  @ApiOperation({ summary: 'Get all users with pagination, filter, and search' })
  findAll(@CurrentUser() user: any, @Query() query: UserQueryDto) {
    return this.usersService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'User' })
  @ApiOperation({ summary: 'Get a single user by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'User' })
  @ApiOperation({ summary: 'Update a user' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.organizationId, user.id, id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'User' })
  @ApiOperation({ summary: 'Delete a user' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.remove(user.organizationId, user.id, id);
  }

  @Post(':id/activate')
  @RequirePermissions({ action: 'CREATE', subject: 'User' })
  @ApiOperation({ summary: 'Activate a user' })
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.setActivationStatus(user.organizationId, user.id, id, true);
  }

  @Post(':id/deactivate')
  @RequirePermissions({ action: 'CREATE', subject: 'User' })
  @ApiOperation({ summary: 'Deactivate a user' })
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.setActivationStatus(user.organizationId, user.id, id, false);
  }

  @Post(':id/roles')
  @RequirePermissions({ action: 'CREATE', subject: 'User' })
  @ApiOperation({ summary: 'Assign roles to a user (overwrites existing)' })
  assignRoles(@CurrentUser() user: any, @Param('id') id: string, @Body() assignRolesDto: AssignRolesDto, @Query('orgId') orgId?: string) {
    const targetOrg = (user.isPlatformAdmin && orgId) ? orgId : user.organizationId;
    return this.usersService.assignRoles(targetOrg, user.id, id, assignRolesDto.roleIds);
  }

  @Delete(':id/roles')
  @RequirePermissions({ action: 'DELETE', subject: 'User' })
  @ApiOperation({ summary: 'Remove specific roles from a user' })
  removeRoles(@CurrentUser() user: any, @Param('id') id: string, @Body() assignRolesDto: AssignRolesDto, @Query('orgId') orgId?: string) {
    const targetOrg = (user.isPlatformAdmin && orgId) ? orgId : user.organizationId;
    return this.usersService.removeRoles(targetOrg, user.id, id, assignRolesDto.roleIds);
  }

  @Post(':id/properties')
  @RequirePermissions({ action: 'UPDATE', subject: 'User' })
  @ApiOperation({ summary: 'Assign properties to a building manager (overwrites existing)' })
  assignProperties(@CurrentUser() user: any, @Param('id') id: string, @Body() assignPropertiesDto: AssignPropertiesDto) {
    return this.usersService.assignProperties(user.organizationId, user.id, id, assignPropertiesDto.propertyIds);
  }

  @Patch(':id/lock')
  @RequirePermissions({ action: 'UPDATE', subject: 'User' })
  @ApiOperation({ summary: 'Lock or unlock a user in your organization' })
  lockUser(@CurrentUser() user: any, @Param('id') id: string, @Body() data: { isPermanentlyLocked: boolean }, @Query('orgId') orgId?: string) {
    const targetOrg = (user.isPlatformAdmin && orgId) ? orgId : user.organizationId;
    return this.usersService.setUserLock(targetOrg, id, data.isPermanentlyLocked);
  }

  @Get('platform/all')
  @RequirePermissions({ action: 'READ', subject: 'User' })
  @ApiOperation({ summary: 'Get ALL users across all organizations (Platform Admin only)' })
  findAllPlatformUsers(@CurrentUser() user: any) {
    if (!user.isPlatformAdmin) {
      throw new ForbiddenException('Only platform administrators can access this resource.');
    }
    return this.usersService.findAllPlatformUsers();
  }

  @Patch('platform/:id/lock')
  @RequirePermissions({ action: 'UPDATE', subject: 'User' })
  @ApiOperation({ summary: 'Lock or unlock a user (Platform Admin only)' })
  lockPlatformUser(@CurrentUser() user: any, @Param('id') id: string, @Body() data: { isPermanentlyLocked: boolean }) {
    if (!user.isPlatformAdmin) {
      throw new ForbiddenException('Only platform administrators can access this resource.');
    }
    return this.usersService.setPlatformUserLock(id, data.isPermanentlyLocked);
  }
}
