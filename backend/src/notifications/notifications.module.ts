import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationTemplatesController } from './notification-templates.controller';
import { DeviceTokensController } from './device-tokens.controller';

@Module({
  controllers: [
    NotificationsController,
    NotificationTemplatesController,
    DeviceTokensController
  ],
  providers: [NotificationsService, NotificationTemplatesService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
