import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto, NotificationQueryDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('send')
  @RequirePermissions({ action: 'CREATE', subject: 'Notification' })
  @ApiOperation({ summary: 'Send a notification' })
  send(@CurrentUser() user: any, @Body() dto: SendNotificationDto) {
    return this.service.send(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notification history for current user' })
  findAll(@CurrentUser() user: any, @Query() query: NotificationQueryDto) {
    return this.service.findAllForUser(user.id, user.organizationId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.service.markAllAsRead(user.id);
  }
}
