import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockQueryDto } from './dto/block-query.dto';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createBlockDto: CreateBlockDto) {
    if (createBlockDto.buildingId) {
      const parent = await this.prisma.propertyNode.findFirst({
        where: { id: createBlockDto.buildingId, organizationId }
      });
      if (!parent) throw new NotFoundException('Building not found in your organization.');
    }

    return this.prisma.propertyNode.create({
      data: {
        organizationId,
        nodeType: 'TOWER',
        parentId: createBlockDto.buildingId,
        name: createBlockDto.name,
      },
    });
  }

  async findAll(organizationId: string, query: BlockQueryDto) {
    const { buildingId, search, skip, take } = query as any;

    const where = {
      organizationId,
      ...(buildingId ? { parentId: buildingId } : {}), nodeType: "TOWER",
      ...(search ? {
        name: { contains: search, mode: 'insensitive' as any }
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.propertyNode.findMany({
        where,
        skip,
        take,
        include: { parent: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.propertyNode.count({ where }),
    ]);

    const mappedItems = items.map((item) => ({
      ...item,
      buildingId: item.parentId,
      building: item.parent,
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
    const block = await this.prisma.propertyNode.findFirst({
      where: { id, organizationId },
      include: {
        parent: true,
      }
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${id} not found`);
    }

    return {
      ...block,
      buildingId: block.parentId,
      building: block.parent,
    };
  }

  async update(organizationId: string, id: string, updateBlockDto: UpdateBlockDto) {
    await this.findOne(organizationId, id);

    if (updateBlockDto.buildingId) {
      const parent = await this.prisma.propertyNode.findFirst({
        where: { id: updateBlockDto.buildingId, organizationId }
      });
      if (!parent) throw new NotFoundException('Building not found in your organization.');
    }

    return this.prisma.propertyNode.update({
      where: { id },
      data: {
        name: updateBlockDto.name,
        parentId: updateBlockDto.buildingId,
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
