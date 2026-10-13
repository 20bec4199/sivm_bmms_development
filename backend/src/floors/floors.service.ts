import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';

@Injectable()
export class FloorsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createFloorDto: CreateFloorDto) {
    if (createFloorDto.towerId) {
      const parent = await this.prisma.propertyNode.findFirst({
        where: { id: createFloorDto.towerId, organizationId }
      });
      if (!parent) throw new NotFoundException('Block/Tower not found in your organization.');
    }

    return this.prisma.propertyNode.create({
      data: {
        organizationId,
        nodeType: 'FLOOR',
        parentId: createFloorDto.towerId,
        name: createFloorDto.name,
        metadata: { level: createFloorDto.level },
      },
    });
  }

  async findAll(organizationId: string, towerId?: string) {
    const where = {
      organizationId,
      ...(towerId ? { parentId: towerId } : {}), nodeType: "FLOOR",
    };

    const [items, total] = await Promise.all([
      this.prisma.propertyNode.findMany({
        where,
        include: { parent: { include: { parent: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.propertyNode.count({ where }),
    ]);

    const mappedItems = items.map((item) => ({
      ...item,
      towerId: item.parentId,
      tower: item.parent,
      buildingId: item.parent?.parentId,
      building: (item.parent as any)?.parent,
    }));

    return {
      data: mappedItems,
      meta: {
        total,
        skip: 0,
        take: items.length,
      }
    };
  }

  async findOne(organizationId: string, id: string) {
    const floor = await this.prisma.propertyNode.findFirst({
      where: { id, organizationId },
      include: {
        parent: { include: { parent: true } },
      }
    });

    if (!floor) {
      throw new NotFoundException(`Floor with ID ${id} not found`);
    }

    return {
      ...floor,
      towerId: floor.parentId,
      tower: floor.parent,
      buildingId: floor.parent?.parentId,
      building: (floor.parent as any)?.parent,
    };
  }

  async update(organizationId: string, id: string, updateFloorDto: UpdateFloorDto) {
    await this.findOne(organizationId, id);

    if (updateFloorDto.towerId) {
      const parent = await this.prisma.propertyNode.findFirst({
        where: { id: updateFloorDto.towerId, organizationId }
      });
      if (!parent) throw new NotFoundException('Block/Tower not found in your organization.');
    }

    return this.prisma.propertyNode.update({
      where: { id },
      data: {
        name: updateFloorDto.name,
        parentId: updateFloorDto.towerId,
        metadata: updateFloorDto.level ? { level: updateFloorDto.level } : undefined
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
