import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createVehicleDto: CreateVehicleDto) {
    if (createVehicleDto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: createVehicleDto.propertyNodeId, organizationId }
      });
      if (!property) throw new NotFoundException('Property not found in your organization.');
    }

    try {
      return await this.prisma.vehicle.create({
        data: {
          ...createVehicleDto,
          organizationId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`A vehicle with the license plate '${createVehicleDto.licensePlate}' is already registered in this organization.`);
      }
      throw error;
    }
  }

  async findAll(organizationId: string, query: VehicleQueryDto) {
    const { propertyNodeId, search, skip, take } = query;

    const where = {
      organizationId,
      ...(propertyNodeId ? { propertyNodeId } : {}),
      ...(search ? {
        OR: [
          { licensePlate: { contains: search, mode: 'insensitive' as any } },
          { make: { contains: search, mode: 'insensitive' as any } },
          { model: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take,
        include: { propertyNode: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, organizationId },
      include: { propertyNode: true }
    });

    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${id} not found`);
    return vehicle;
  }

  async update(organizationId: string, id: string, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(organizationId, id);

    if (updateVehicleDto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: updateVehicleDto.propertyNodeId, organizationId }
      });
      if (!property) throw new NotFoundException('Property not found in your organization.');
    }

    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: updateVehicleDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`A vehicle with the license plate '${updateVehicleDto.licensePlate}' is already registered in this organization.`);
      }
      throw error;
    }
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
