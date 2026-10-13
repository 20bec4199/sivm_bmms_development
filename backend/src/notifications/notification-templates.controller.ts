import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateTemplateDto } from './dto/notification-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'NotificationTemplate' })
  @ApiOperation({ summary: 'Create a notification template' })
  create(@CurrentUser() user: any, @Body() dto: CreateTemplateDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'NotificationTemplate' })
  @ApiOperation({ summary: 'Get all notification templates' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'NotificationTemplate' })
  @ApiOperation({ summary: 'Update a notification template' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateTemplateDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'NotificationTemplate' })
  @ApiOperation({ summary: 'Delete a notification template' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
