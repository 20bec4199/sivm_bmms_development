import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateOwnerDto, UpdateOwnerDto, OwnerQueryDto } from './dto/owners.dto';

@Injectable()
export class OwnersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  async create(organizationId: string, createOwnerDto: CreateOwnerDto) {
    if (createOwnerDto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: createOwnerDto.propertyNodeId, organizationId },
        include: {
          parkingAreas: true,
          parkingAllocations: { where: { isActive: true } }
        }
      });
      if (!property) throw new NotFoundException('Property not found in your organization.');
      if (
        property.status === 'PARKING_ALLOCATED' ||
        (property.parkingAreas && property.parkingAreas.length > 0) ||
        (property.metadata && (property.metadata as any).isParkingArea)
      ) {
        throw new BadRequestException('This unit has been allocated as a parking area and cannot be assigned to an owner.');
      }
    }

    const owner = await this.prisma.owner.create({
      data: {
        ...createOwnerDto,
        organizationId,
      },
    });
    
    if (owner.email) {
      try {
        const result = await this.authService.inviteResident({
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          orgId: organizationId,
          roleName: 'UNIT_OWNER',
        });
        
        if (result.user?.id) {
          await this.prisma.owner.update({
            where: { id: owner.id },
            data: { userId: result.user.id }
          });
        }
      } catch (err) {
        console.error('Failed to provision user for owner:', err);
      }
    }

    return owner;
  }

  async findAll(organizationId: string, query: OwnerQueryDto) {
    const { propertyNodeId, search, skip, take } = query;

    const where = {
      organizationId,
      ...(propertyNodeId ? { propertyNodeId } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as any } },
          { lastName: { contains: search, mode: 'insensitive' as any } },
          { email: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.owner.findMany({
        where,
        skip,
        take,
        include: { propertyNode: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.owner.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const owner = await this.prisma.owner.findFirst({
      where: { id, organizationId },
      include: { propertyNode: true }
    });

    if (!owner) throw new NotFoundException(`Owner with ID ${id} not found`);
    return owner;
  }

  async update(organizationId: string, id: string, updateOwnerDto: UpdateOwnerDto) {
    await this.findOne(organizationId, id);

    if (updateOwnerDto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: updateOwnerDto.propertyNodeId, organizationId },
        include: {
          parkingAreas: true,
          parkingAllocations: { where: { isActive: true } }
        }
      });
      if (!property) throw new NotFoundException('Property not found in your organization.');
      if (
        property.status === 'PARKING_ALLOCATED' ||
        (property.parkingAreas && property.parkingAreas.length > 0) ||
        (property.metadata && (property.metadata as any).isParkingArea)
      ) {
        throw new BadRequestException('This unit has been allocated as a parking area and cannot be assigned to an owner.');
      }
    }

    return this.prisma.owner.update({
      where: { id },
      data: updateOwnerDto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.owner.delete({ where: { id } });
  }
}
