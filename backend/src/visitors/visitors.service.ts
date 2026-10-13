import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitorDto, VisitorQueryDto } from './dto/visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, dto: CreateVisitorDto) {
    return this.prisma.visitor.create({
      data: {
        ...dto,
        organizationId: user.organizationId,
      },
    });
  }

  private async getResidentPropertyNodeIds(user: any): Promise<string[]> {
    const userId = typeof user === 'string' ? user : user?.id;
    const userEmail = typeof user === 'object' ? user?.email : undefined;

    const [upNodes, owners, tenants] = await Promise.all([
      userId
        ? this.prisma.userPropertyNode.findMany({
            where: { userId },
            select: { propertyNodeId: true }
          })
        : [],
      this.prisma.owner.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail ? [{ email: userEmail }] : []),
          ]
        },
        select: { propertyNodeId: true }
      }),
      this.prisma.tenant.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail ? [{ email: userEmail }] : []),
          ]
        },
        select: { propertyNodeId: true }
      })
    ]);

    const ids = new Set<string>();
    upNodes.forEach((n: any) => ids.add(n.propertyNodeId));
    owners.forEach((o: any) => ids.add(o.propertyNodeId));
    tenants.forEach((t: any) => ids.add(t.propertyNodeId));
    return Array.from(ids);
  }

  async findAll(user: any, query: VisitorQueryDto) {
    const { search, skip, take } = query;
    const organizationId = user.organizationId;
    
    const isOrgAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.isPlatformAdmin;
    let propertyNodeIds: string[] | undefined = undefined;

    if (!isOrgAdmin && (user.roles?.includes('RESIDENT') || user.roles?.includes('UNIT_OWNER') || user.roles?.includes('TENANT'))) {
      propertyNodeIds = await this.getResidentPropertyNodeIds(user);
      if (propertyNodeIds.length === 0) {
        return { data: [], meta: { total: 0, skip, take } };
      }
    }

    const where: any = {
      organizationId,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as any } },
          { lastName: { contains: search, mode: 'insensitive' as any } },
          { phone: { contains: search, mode: 'insensitive' as any } },
          { idNumber: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    if (propertyNodeIds) {
      where.registrations = {
        some: { propertyNodeId: { in: propertyNodeIds } }
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.visitor.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(user: any, id: string) {
    const organizationId = user.organizationId;
    const isOrgAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.isPlatformAdmin;
    let propertyNodeIds: string[] | undefined = undefined;

    if (!isOrgAdmin && (user.roles?.includes('RESIDENT') || user.roles?.includes('TENANT'))) {
      propertyNodeIds = await this.getResidentPropertyNodeIds(user.id);
      if (propertyNodeIds.length === 0) {
        throw new NotFoundException('Visitor not found');
      }
    }

    const where: any = { id, organizationId };
    
    if (propertyNodeIds) {
      where.registrations = {
        some: { propertyNodeId: { in: propertyNodeIds } }
      };
    }

    const visitor = await this.prisma.visitor.findFirst({
      where,
      include: {
        registrations: {
          include: { propertyNode: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }
}
