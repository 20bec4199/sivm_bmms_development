import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto, UpdateIncidentDto, IncidentQueryDto } from './dto/incident.dto';
import { CreatePatrolRouteDto, LogPatrolDto } from './dto/patrol.dto';
import {
  CreateSecurityPostAssignmentDto,
  CreateSecurityPostDto,
  UpdateSecurityPostAssignmentDto,
  UpdateSecurityPostDto,
} from './dto/security-post.dto';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async getSecurityPosts(organizationId: string) {
    return this.prisma.securityPost.findMany({
      where: { organizationId },
      include: {
        propertyNode: { select: { id: true, name: true, nodeType: true } },
        parkingArea: {
          select: {
            id: true,
            name: true,
            propertyNode: { select: { id: true, name: true, nodeType: true } },
          },
        },
        assignments: {
          include: {
            guard: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createSecurityPost(organizationId: string, dto: CreateSecurityPostDto) {
    if (dto.propertyNodeId && dto.parkingAreaId) {
      throw new BadRequestException('Choose a building/property or a parking area for a post, not both.');
    }
    if (dto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: dto.propertyNodeId, organizationId },
        select: { id: true },
      });
      if (!property) throw new NotFoundException('Property location not found in this organization.');
    }
    if (dto.parkingAreaId) {
      const area = await this.prisma.parkingArea.findFirst({
        where: { id: dto.parkingAreaId, organizationId },
        select: { id: true },
      });
      if (!area) throw new NotFoundException('Parking area not found in this organization.');
    }

    return this.prisma.securityPost.create({
      data: { ...dto, organizationId, duties: dto.duties ?? [] },
      include: {
        propertyNode: { select: { id: true, name: true, nodeType: true } },
        parkingArea: { select: { id: true, name: true } },
        assignments: true,
      },
    });
  }

  async updateSecurityPost(organizationId: string, id: string, dto: UpdateSecurityPostDto) {
    const post = await this.prisma.securityPost.findFirst({ where: { id, organizationId } });
    if (!post) throw new NotFoundException('Security post not found.');

    if (dto.propertyNodeId && dto.parkingAreaId) {
      throw new BadRequestException('Choose a building/property or a parking area for a post, not both.');
    }
    if (dto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: dto.propertyNodeId, organizationId }, select: { id: true },
      });
      if (!property) throw new NotFoundException('Property location not found in this organization.');
    }
    if (dto.parkingAreaId) {
      const area = await this.prisma.parkingArea.findFirst({
        where: { id: dto.parkingAreaId, organizationId }, select: { id: true },
      });
      if (!area) throw new NotFoundException('Parking area not found in this organization.');
    }

    return this.prisma.securityPost.update({
      where: { id },
      data: dto,
      include: {
        propertyNode: { select: { id: true, name: true, nodeType: true } },
        parkingArea: { select: { id: true, name: true } },
      },
    });
  }

  async getMyAssignedPosts(organizationId: string, guardId: string) {
    return this.prisma.securityPostAssignment.findMany({
      where: { organizationId, guardId, isActive: true, post: { isActive: true } },
      include: {
        post: {
          include: {
            propertyNode: { select: { id: true, name: true, nodeType: true } },
            parkingArea: {
              select: {
                id: true,
                name: true,
                propertyNode: { select: { id: true, name: true, nodeType: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignGuardToPost(
    organizationId: string,
    postId: string,
    assignedById: string,
    dto: CreateSecurityPostAssignmentDto,
  ) {
    const [post, guard] = await Promise.all([
      this.prisma.securityPost.findFirst({ where: { id: postId, organizationId }, select: { id: true, isActive: true } }),
      this.prisma.user.findFirst({
        where: {
          id: dto.guardId,
          organizationId,
          isActive: true,
          userRoles: { some: { role: { name: 'SECURITY_GUARD', organizationId } } },
        },
        select: { id: true },
      }),
    ]);
    if (!post) throw new NotFoundException('Security post not found.');
    if (!post.isActive) throw new BadRequestException('Cannot assign a guard to an inactive post.');
    if (!guard) throw new NotFoundException('Active Security Guard account not found in this organization.');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (startsAt && endsAt && startsAt >= endsAt) {
      throw new BadRequestException('Assignment end time must be after its start time.');
    }

    return this.prisma.securityPostAssignment.create({
      data: {
        organizationId,
        postId,
        guardId: dto.guardId,
        assignedById,
        shiftName: dto.shiftName?.trim() || 'General',
        startsAt,
        endsAt,
        daysOfWeek: dto.daysOfWeek ?? [],
        notes: dto.notes,
      },
      include: { guard: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async updatePostAssignment(organizationId: string, id: string, dto: UpdateSecurityPostAssignmentDto) {
    const assignment = await this.prisma.securityPostAssignment.findFirst({ where: { id, organizationId } });
    if (!assignment) throw new NotFoundException('Security post assignment not found.');

    const startsAt = dto.startsAt === undefined ? assignment.startsAt : dto.startsAt ? new Date(dto.startsAt) : null;
    const endsAt = dto.endsAt === undefined ? assignment.endsAt : dto.endsAt ? new Date(dto.endsAt) : null;
    if (startsAt && endsAt && startsAt >= endsAt) {
      throw new BadRequestException('Assignment end time must be after its start time.');
    }

    return this.prisma.securityPostAssignment.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
      },
      include: { guard: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async removePostAssignment(organizationId: string, id: string) {
    const assignment = await this.prisma.securityPostAssignment.findFirst({ where: { id, organizationId } });
    if (!assignment) throw new NotFoundException('Security post assignment not found.');
    await this.prisma.securityPostAssignment.delete({ where: { id } });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ─────────────────────────────────────────────────────────────────────────────

  async getDashboardStats(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      totalIncidents,
      openIncidents,
      todayIncidents,
      activeVisitors,
      todayVisitorLogs,
      patrolRoutes,
      todayPatrolLogs,
    ] = await Promise.all([
      this.prisma.incident.count({ where: { organizationId } }),
      this.prisma.incident.count({
        where: { organizationId, status: { in: ['REPORTED', 'INVESTIGATING'] } },
      }),
      this.prisma.incident.count({
        where: { organizationId, createdAt: { gte: today, lt: tomorrow } },
      }),
      // Active visitors = checked in but NOT checked out today
      this.prisma.visitorLog.count({
        where: {
          registration: { organizationId },
          checkInTime: { not: null },
          checkOutTime: null,
        },
      }),
      // Today's total visitor check-ins
      this.prisma.visitorLog.count({
        where: {
          registration: { organizationId },
          checkInTime: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.patrolRoute.count({ where: { organizationId, isActive: true } }),
      this.prisma.patrolLog.count({
        where: {
          checkpoint: { route: { organizationId } },
          scannedAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    // Recent incidents for activity feed
    const recentIncidents = await this.prisma.incident.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        createdAt: true,
      },
    });

    // Recent access events (visitor logs)
    const recentAccess = await this.prisma.visitorLog.findMany({
      where: { registration: { organizationId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        registration: {
          include: {
            visitor: { select: { firstName: true, lastName: true } },
            propertyNode: { select: { name: true } },
          },
        },
      },
    });

    return {
      stats: {
        totalIncidents,
        openIncidents,
        todayIncidents,
        activeVisitors,
        todayVisitorLogs,
        patrolRoutes,
        todayPatrolLogs,
      },
      recentIncidents,
      recentAccess,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INCIDENTS
  // ─────────────────────────────────────────────────────────────────────────────

  async createIncident(organizationId: string, reportedById: string, dto: CreateIncidentDto) {
    return this.prisma.incident.create({
      data: {
        organizationId,
        reportedById,
        title: dto.title,
        description: dto.description,
        severity: dto.severity ?? 'MINOR',
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : new Date(),
      },
    });
  }

  async findAllIncidents(organizationId: string, query: IncidentQueryDto) {
    const { status, severity, search, skip = 0, take = 20 } = query;

    const where: any = {
      organizationId,
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.incident.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOneIncident(organizationId: string, id: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, organizationId },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateIncident(organizationId: string, id: string, dto: UpdateIncidentDto) {
    const incident = await this.findOneIncident(organizationId, id);
    return this.prisma.incident.update({
      where: { id: incident.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.incidentDate !== undefined ? { incidentDate: new Date(dto.incidentDate) } : {}),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATROL ROUTES
  // ─────────────────────────────────────────────────────────────────────────────

  async createPatrolRoute(organizationId: string, dto: CreatePatrolRouteDto) {
    return this.prisma.patrolRoute.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        checkpoints: {
          create: dto.checkpoints.map((cp) => ({
            name: cp.name,
            location: cp.location,
            latitude: cp.latitude,
            longitude: cp.longitude,
            orderIndex: cp.orderIndex,
          })),
        },
      },
      include: { checkpoints: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async findAllPatrolRoutes(organizationId: string) {
    return this.prisma.patrolRoute.findMany({
      where: { organizationId },
      include: {
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { checkpoints: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePatrolRoute(organizationId: string, id: string) {
    const route = await this.prisma.patrolRoute.findFirst({
      where: { id, organizationId },
      include: {
        checkpoints: {
          orderBy: { orderIndex: 'asc' },
          include: {
            logs: {
              orderBy: { scannedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!route) throw new NotFoundException('Patrol route not found');
    return route;
  }

  async togglePatrolRoute(organizationId: string, id: string) {
    const route = await this.findOnePatrolRoute(organizationId, id);
    return this.prisma.patrolRoute.update({
      where: { id: route.id },
      data: { isActive: !route.isActive },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATROL LOGS (Guard check-in at checkpoints)
  // ─────────────────────────────────────────────────────────────────────────────

  async logPatrolCheckpoint(guardId: string, organizationId: string, dto: LogPatrolDto) {
    // Verify checkpoint belongs to this org
    const checkpoint = await this.prisma.patrolCheckpoint.findFirst({
      where: { id: dto.checkpointId, route: { organizationId } },
    });
    if (!checkpoint) throw new NotFoundException('Checkpoint not found');

    return this.prisma.patrolLog.create({
      data: {
        checkpointId: dto.checkpointId,
        guardId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
      },
      include: {
        checkpoint: {
          include: { route: { select: { name: true } } },
        },
      },
    });
  }

  async getPatrolLogs(organizationId: string, routeId?: string, guardId?: string) {
    const where: any = {
      checkpoint: { route: { organizationId } },
      ...(routeId ? { checkpoint: { routeId } } : {}),
      ...(guardId ? { guardId } : {}),
    };

    return this.prisma.patrolLog.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      take: 50,
      include: {
        checkpoint: {
          include: { route: { select: { id: true, name: true } } },
        },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCESS LOG (Visitor check-in/out history for security view)
  // ─────────────────────────────────────────────────────────────────────────────

  async getAccessLog(organizationId: string, query: { skip?: number; take?: number; search?: string; date?: string }) {
    const { skip = 0, take = 30, search, date } = query;

    let dateFilter: any = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      dateFilter = { checkInTime: { gte: d, lt: next } };
    }

    const [data, total] = await Promise.all([
      this.prisma.visitorLog.findMany({
        where: {
          registration: {
            organizationId,
            ...(search
              ? {
                  visitor: {
                    OR: [
                      { firstName: { contains: search, mode: 'insensitive' } },
                      { lastName: { contains: search, mode: 'insensitive' } },
                      { phone: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                }
              : {}),
          },
          ...dateFilter,
        },
        include: {
          registration: {
            include: {
              visitor: { select: { firstName: true, lastName: true, phone: true, idNumber: true } },
              propertyNode: { select: { name: true } },
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
        skip,
        take,
      }),
      this.prisma.visitorLog.count({
        where: {
          registration: { organizationId },
          ...dateFilter,
        },
      }),
    ]);

    return { data, total, skip, take };
  }
}
