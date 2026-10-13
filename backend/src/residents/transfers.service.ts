import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto, TransferQueryDto } from './dto/transfers.dto';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async transferOwnership(organizationId: string, createTransferDto: CreateTransferDto) {
    const { propertyNodeId, previousOwnerId, newOwner, notes } = createTransferDto;

    // Security: Verify that the target property node belongs to the current organization
    const property = await this.prisma.propertyNode.findFirst({
      where: { id: propertyNodeId, organizationId },
      include: {
        parkingAreas: true,
      }
    });
    if (!property) throw new NotFoundException('Property not found in your organization.');
    if (
      property.status === 'PARKING_ALLOCATED' ||
      (property.parkingAreas && property.parkingAreas.length > 0) ||
      (property.metadata && (property.metadata as any).isParkingArea)
    ) {
      throw new BadRequestException('This unit has been allocated as a parking area and cannot undergo residential ownership transfer.');
    }

    // Security: Verify that the previous owner belongs to the current organization
    if (previousOwnerId) {
      const prevOwner = await this.prisma.owner.findFirst({
        where: { id: previousOwnerId, organizationId }
      });
      if (!prevOwner) throw new NotFoundException('Previous owner not found in your organization.');
    }

    return this.prisma.$transaction(async (tx) => {
      const createdOwner = await tx.owner.create({
        data: {
          ...newOwner,
          propertyNodeId,
          organizationId,
        }
      });

      const history = await tx.unitTransferHistory.create({
        data: {
          organizationId,
          propertyNodeId,
          previousOwnerId,
          newOwnerId: createdOwner.id,
          notes,
        }
      });

      return { createdOwner, history };
    });
  }

  async findAll(organizationId: string, query: TransferQueryDto) {
    const { propertyNodeId, skip, take } = query;

    const where = {
      organizationId,
      ...(propertyNodeId ? { propertyNodeId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.unitTransferHistory.findMany({
        where,
        skip,
        take,
        include: { propertyNode: true },
        orderBy: { transferDate: 'desc' },
      }),
      this.prisma.unitTransferHistory.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }
}
