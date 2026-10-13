import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/notification-template.dto';

@Injectable()
export class NotificationTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: { ...dto, organizationId }
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.notificationTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(organizationId: string, id: string, dto: CreateTemplateDto) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id, organizationId }
    });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: dto
    });
  }

  async remove(organizationId: string, id: string) {
    return this.prisma.notificationTemplate.delete({
      where: { id, organizationId }
    });
  }
}
