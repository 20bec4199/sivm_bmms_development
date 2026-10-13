import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitQueryDto } from './dto/unit-query.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createUnitDto: CreateUnitDto) {
    const parentId = createUnitDto.floorId || createUnitDto.towerId || createUnitDto.buildingId;
    if (parentId) {
      const parent = await this.prisma.propertyNode.findFirst({
        where: { id: parentId, organizationId }
      });
      if (!parent) throw new NotFoundException('Parent property node not found in your organization.');
    }

    return this.prisma.propertyNode.create({
      data: {
        organizationId,
        nodeType: 'UNIT',
        name: createUnitDto.unitNumber,
        parentId: createUnitDto.floorId || createUnitDto.towerId || createUnitDto.buildingId,
        metadata: { 
          category: createUnitDto.category, 
          type: createUnitDto.type,
          sizeSqft: createUnitDto.sizeSqft,
          status: createUnitDto.status
        },
      },
    });
  }

  async findResidentUnits(user: any) {
    const userId = user?.id;
    const userEmail = user?.email;
    const organizationId = user?.organizationId;

    if (!userId && !userEmail) {
      return { data: [], meta: { total: 0 } };
    }

    // Find all unit IDs linked to this user across UserPropertyNode, Owner, and Tenant
    const [upNodes, owners, tenants] = await Promise.all([
      userId
        ? this.prisma.userPropertyNode.findMany({
            where: { userId },
            select: { propertyNodeId: true },
          })
        : [],
      this.prisma.owner.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail ? [{ email: userEmail }] : []),
          ],
        },
        select: { propertyNodeId: true },
      }),
      this.prisma.tenant.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail ? [{ email: userEmail }] : []),
          ],
        },
        select: { propertyNodeId: true },
      }),
    ]);

    const unitIds = new Set<string>();
    upNodes.forEach((n: any) => unitIds.add(n.propertyNodeId));
    owners.forEach((o: any) => unitIds.add(o.propertyNodeId));
    tenants.forEach((t: any) => unitIds.add(t.propertyNodeId));

    if (unitIds.size === 0) {
      return { data: [], meta: { total: 0 } };
    }

    const items = await this.prisma.propertyNode.findMany({
      where: {
        id: { in: Array.from(unitIds) },
        nodeType: 'UNIT',
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        parent: { include: { parent: { include: { parent: true } } } },
        owners: {
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(userEmail ? [{ email: userEmail }] : []),
            ],
          },
        },
        tenants: {
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(userEmail ? [{ email: userEmail }] : []),
            ],
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const mapped = items.map((item) => {
      const floor = item.parent;
      const tower = floor?.parent;
      const building = tower?.parent;
      const isOwner = item.owners && item.owners.length > 0;
      const isTenant = item.tenants && item.tenants.length > 0;
      const occupancyRole = isOwner ? 'OWNER' : isTenant ? 'TENANT' : 'RESIDENT';

      return {
        ...item,
        unitNumber: item.name,
        floorId: item.parentId,
        floor,
        towerId: floor?.parentId,
        tower,
        buildingId: tower?.parentId,
        building,
        occupancyRole,
        floorName: floor?.name || 'Unknown Floor',
        towerName: tower?.name || 'Unknown Tower',
        buildingName: building?.name || 'Unknown Building',
        fullPath: [building?.name, tower?.name, floor?.name, `Unit ${item.name}`]
          .filter(Boolean)
          .join(' ➔ '),
        shortLabel: `Unit ${item.name} — ${tower?.name || ''} (${floor?.name || ''}) [${occupancyRole}]`,
      };
    });

    return {
      data: mapped,
      meta: { total: mapped.length },
    };
  }

  async findAll(organizationId: string, query: UnitQueryDto, user?: any) {
    const isResident =
      user?.roles?.includes('RESIDENT') ||
      user?.roles?.includes('UNIT_OWNER') ||
      user?.roles?.includes('TENANT');

    if (query?.myUnits || isResident) {
      return this.findResidentUnits(user);
    }

    const { buildingId, towerId, floorId, search, type, status, skip, take } = query as any;

    const where: any = {
      organizationId,
      ...(floorId ? { parentId: floorId } : {}), nodeType: "UNIT",
      ...(search ? {
        name: { contains: search, mode: 'insensitive' as any }
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.propertyNode.findMany({
        where,
        skip,
        take,
        include: {
          parent: { include: { parent: { include: { parent: true } } } },
          parkingAreas: true,
          parkingAllocations: { where: { isActive: true } },
          owners: true,
          tenants: true,
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.propertyNode.count({ where }),
    ]);

    const mappedItems = items.map((item) => ({
      ...item,
      floorId: item.parentId,
      floor: item.parent,
      towerId: item.parent?.parentId,
      tower: (item.parent as any)?.parent,
      buildingId: (item.parent as any)?.parent?.parentId,
      building: ((item.parent as any)?.parent as any)?.parent,
    }));

    return {
      data: mappedItems,
      meta: {
        total,
        skip,
        take,
      }
    };
  }

  async findOne(organizationId: string, id: string) {
    const unit = await this.prisma.propertyNode.findFirst({
      where: { id, organizationId },
      include: {
        parent: { include: { parent: { include: { parent: true } } } },
        parkingAreas: true,
        parkingAllocations: { where: { isActive: true } },
        owners: true,
        tenants: true,
      }
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    return {
      ...unit,
      floorId: unit.parentId,
      floor: unit.parent,
      towerId: unit.parent?.parentId,
      tower: (unit.parent as any)?.parent,
      buildingId: (unit.parent as any)?.parent?.parentId,
      building: ((unit.parent as any)?.parent as any)?.parent,
    };
  }

  async update(organizationId: string, id: string, updateUnitDto: UpdateUnitDto) {
    await this.findOne(organizationId, id);

    const parentId = updateUnitDto.floorId || updateUnitDto.towerId || updateUnitDto.buildingId;
    if (parentId) {
      const parent = await this.prisma.propertyNode.findFirst({
        where: { id: parentId, organizationId }
      });
      if (!parent) throw new NotFoundException('Parent property node not found in your organization.');
    }

    return this.prisma.propertyNode.update({
      where: { id },
      data: {
        name: updateUnitDto.unitNumber,
        parentId: updateUnitDto.floorId || updateUnitDto.towerId || updateUnitDto.buildingId,
        metadata: {
          category: updateUnitDto.category, 
          type: updateUnitDto.type,
          sizeSqft: updateUnitDto.sizeSqft,
          status: updateUnitDto.status
        }
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.propertyNode.delete({
      where: { id },
    });
  }
}
