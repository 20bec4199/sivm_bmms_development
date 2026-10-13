import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto, UpdateFacilityDto, FacilityQueryDto } from './dto/facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateFacilityDto) {
    return this.prisma.facility.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, query: FacilityQueryDto) {
    const { search, skip, take } = query;

    const where = {
      organizationId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { description: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.facility.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.facility.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const facility = await this.prisma.facility.findFirst({
      where: { id, organizationId }
    });

    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  async update(organizationId: string, id: string, dto: UpdateFacilityDto) {
    await this.findOne(organizationId, id);

    return this.prisma.facility.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.facilityBooking.deleteMany({ where: { facilityId: id } });
    return this.prisma.facility.delete({ where: { id } });
  }

  async getUsageReports(organizationId: string) {
    const stats = await this.prisma.facilityBooking.groupBy({
      by: ['facilityId'],
      where: {
        organizationId,
        status: { in: ['COMPLETED', 'CONFIRMED'] }
      },
      _count: { id: true },
      _sum: { totalCost: true }
    });

    const facilityIds = stats.map(s => s.facilityId);
    const facilities = await this.prisma.facility.findMany({
      where: { id: { in: facilityIds } },
      select: { id: true, name: true }
    });

    return stats.map(s => {
      const facility = facilities.find(f => f.id === s.facilityId);
      return {
        facilityId: s.facilityId,
        facilityName: facility?.name || 'Unknown',
        totalBookings: s._count.id,
        totalRevenue: s._sum.totalCost || 0
      };
    });
  }
}
