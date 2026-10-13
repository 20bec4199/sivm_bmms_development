import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createPropertyDto: CreatePropertyDto) {
    return this.prisma.propertyNode.create({
      data: {
        ...createPropertyDto,
        organizationId, nodeType: "BUILDING",
      },
    });
  }

  async findAll(organizationId: string, query: PropertyQueryDto) {
    const { search, skip, take } = query;

    const where = {
      organizationId,
      nodeType: 'BUILDING',
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { city: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.propertyNode.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.propertyNode.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        skip,
        take,
      }
    };
  }

  async findOne(organizationId: string, id: string) {
    const property = await this.prisma.propertyNode.findFirst({
      where: { id, organizationId },
      include: {
        
        
      }
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(organizationId: string, id: string, updatePropertyDto: UpdatePropertyDto) {
    await this.findOne(organizationId, id);

    return this.prisma.propertyNode.update({
      where: { id },
      data: updatePropertyDto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.propertyNode.delete({
      where: { id },
    });
  }
}
