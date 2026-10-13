import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto, NotificationQueryDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async send(organizationId: string, dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        organizationId,
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
      }
    });

    switch (dto.type) {
      case 'EMAIL':
        this.logger.log(`[MOCK] Sending Email to User ${dto.userId}: ${dto.title}`);
        break;
      case 'PUSH':
        this.logger.log(`[MOCK] Sending Push to User ${dto.userId}: ${dto.title}`);
        break;
      case 'SMS':
        this.logger.log(`[MOCK] Sending SMS to User ${dto.userId}: ${dto.title}`);
        break;
      case 'IN_APP':
        break;
    }

    return notification;
  }

  async findAllForUser(userId: string, organizationId: string, query: NotificationQueryDto) {
    const { isRead, skip, take } = query;

    const where = {
      userId,
      organizationId,
      ...(isRead !== undefined ? { isRead } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.notification.count({ where })
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}
