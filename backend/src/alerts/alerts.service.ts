import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto, AlertQueryDto } from './dto/alert.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async createBroadcast(organizationId: string, createdById: string, dto: CreateAlertDto) {
    if (dto.audience === 'SPECIFIC_NODE' && !dto.targetNodeId) {
      throw new BadRequestException('targetNodeId is required when audience is SPECIFIC_NODE');
    }

    const alert = await this.prisma.alertBroadcast.create({
      data: {
        organizationId,
        createdById,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        priority: dto.priority,
        audience: dto.audience,
        targetNodeId: dto.targetNodeId,
      },
    });

    // Determine target users based on audience
    let targetUsers: { id: string }[] = [];
    
    if (dto.audience === 'ALL') {
      targetUsers = await this.prisma.user.findMany({
        where: { organizationId, isActive: true },
        select: { id: true },
      });
    } else if (dto.audience === 'RESIDENTS') {
      targetUsers = await this.prisma.user.findMany({
        where: { organizationId, isActive: true, userRoles: { some: { role: { name: 'RESIDENT' } } } },
        select: { id: true },
      });
    } else if (dto.audience === 'STAFF') {
      targetUsers = await this.prisma.user.findMany({
        where: { organizationId, isActive: true, userRoles: { some: { role: { name: { in: ['TECHNICIAN', 'SECURITY_GUARD', 'FACILITY_MANAGER'] } } } } },
        select: { id: true },
      });
    } else if (dto.audience === 'SPECIFIC_NODE') {
      // Find all residents who live in this node
      const node = await this.prisma.propertyNode.findUnique({ where: { id: dto.targetNodeId } });
      if (!node) throw new NotFoundException('Target property node not found');
      
      targetUsers = await this.prisma.user.findMany({
        where: { 
          organizationId, 
          isActive: true,
          OR: [
            { tenantProfile: { propertyNodeId: dto.targetNodeId } },
            { ownerProfile: { propertyNodeId: dto.targetNodeId } }
          ]
        },
        select: { id: true },
      });
    }

    // Fire off 1:1 notifications dynamically based on target audience via existing Notifications system
    const notificationPromises = targetUsers.map(u => 
      this.notificationsService.send(organizationId, {
        userId: u.id,
        title: `[${dto.type}] ${dto.title}`,
        message: dto.message,
        type: 'IN_APP'
      })
    );

    // Also send PUSH or EMAIL depending on priority
    if (dto.priority === 'HIGH' || dto.priority === 'CRITICAL') {
      targetUsers.forEach(u => {
        notificationPromises.push(this.notificationsService.send(organizationId, {
          userId: u.id,
          title: `[EMERGENCY ALERT] ${dto.title}`,
          message: dto.message,
          type: 'PUSH'
        }));
      });
    }

    await Promise.allSettled(notificationPromises);
    this.logger.log(`Broadcast Alert sent to ${targetUsers.length} users.`);

    return alert;
  }

  async findAll(organizationId: string, query: AlertQueryDto) {
    const { type, audience, search, skip, take } = query;

    const where = {
      organizationId,
      ...(type ? { type } : {}),
      ...(audience ? { audience } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as any } },
          { message: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.alertBroadcast.findMany({
        where,
        skip,
        take,
        include: { targetNode: { select: { name: true } }, createdBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.alertBroadcast.count({ where })
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const alert = await this.prisma.alertBroadcast.findFirst({
      where: { id, organizationId },
      include: { targetNode: true, createdBy: { select: { firstName: true, lastName: true } } }
    });

    if (!alert) throw new NotFoundException('Alert broadcast not found');
    return alert;
  }
}
