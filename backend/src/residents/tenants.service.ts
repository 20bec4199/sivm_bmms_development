import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  async create(organizationId: string, createTenantDto: CreateTenantDto) {
    if (createTenantDto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: createTenantDto.propertyNodeId, organizationId },
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
        throw new BadRequestException('This unit has been allocated as a parking area and cannot be assigned to a tenant.');
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        ...createTenantDto,
        organizationId,
      },
    });

    await this.prisma.propertyNode.update({
      where: { id: createTenantDto.propertyNodeId },
      data: { status: 'OCCUPIED' }
    });

    if (tenant.email) {
      try {
        const result = await this.authService.inviteResident({
          email: tenant.email,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          orgId: organizationId,
          roleName: 'TENANT',
        });
        
        if (result.user?.id) {
          await this.prisma.tenant.update({
            where: { id: tenant.id },
            data: { userId: result.user.id }
          });
        }
      } catch (err) {
        console.error('Failed to provision user for tenant:', err);
      }
    }

    return tenant;
  }

  async findAll(organizationId: string, query: TenantQueryDto) {
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
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        include: { propertyNode: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, organizationId },
      include: { propertyNode: true }
    });

    if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not found`);
    return tenant;
  }

  async update(organizationId: string, id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(organizationId, id);

    if (updateTenantDto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: updateTenantDto.propertyNodeId, organizationId },
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
        throw new BadRequestException('This unit has been allocated as a parking area and cannot be assigned to a tenant.');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(organizationId: string, id: string) {
    const tenant = await this.findOne(organizationId, id);
    await this.prisma.tenant.delete({ where: { id } });

    const tenantsCount = await this.prisma.tenant.count({
      where: { propertyNodeId: tenant.propertyNodeId }
    });

    if (tenantsCount === 0) {
      await this.prisma.propertyNode.update({
        where: { id: tenant.propertyNodeId },
        data: { status: 'VACANT' }
      });
    }

    return { success: true };
  }
}
