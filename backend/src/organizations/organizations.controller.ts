import { Controller, Get, Post, Param, UseGuards, Patch, Delete, Body, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-request.interface';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me/modules')
  @ApiOperation({ summary: 'Get active modules for the current user organization' })
  getMyModules(@Req() req: any) {
    const user: AuthenticatedUser = req.user;
    return this.organizationsService.getActiveModules(user.organizationId);
  }

  @Post()
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new organization with scoped roles and optional administrator' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user, dto);
  }

  @Get()
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all organizations' })
  findAll(@CurrentUser() user: any) {
    return this.organizationsService.findAll(user);
  }

  @Get(':id')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Get organization by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Update an organization' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    return this.organizationsService.update(user, id, data);
  }

  @Delete(':id')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete an organization and all its data' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.remove(user, id);
  }

  @Get(':id/users')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Get users for an organization' })
  getUsers(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.getUsers(user, id);
  }

  @Patch(':id/users/:userId')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a user in an organization' })
  updateUser(@CurrentUser() user: any, @Param('id') id: string, @Param('userId') userId: string, @Body() data: any) {
    return this.organizationsService.updateUser(user, id, userId, data);
  }

  @Delete(':id/users/:userId')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove a user from an organization' })
  removeUser(@CurrentUser() user: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationsService.removeUser(user, id, userId);
  }

  @Post(':id/activate')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate an organization' })
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.updateStatus(user, id, 'ACTIVE');
  }

  @Post(':id/suspend')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspend an organization' })
  suspend(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.updateStatus(user, id, 'SUSPENDED');
  }

  @Post(':id/deactivate')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate an organization' })
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizationsService.updateStatus(user, id, 'INACTIVE');
  }

  @Post(':id/packages/:packageId')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign a package to an organization' })
  assignPackage(@CurrentUser() user: any, @Param('id') id: string, @Param('packageId') packageId: string) {
    return this.organizationsService.assignPackage(user, id, packageId);
  }

  @Post(':id/addons')
  @Roles('PLATFORM_SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign optional add-on modules to an organization' })
  assignAddons(@CurrentUser() user: any, @Param('id') id: string, @Body() data: { moduleIds: string[] }) {
    return this.organizationsService.assignAddons(user, id, data.moduleIds);
  }
}

