import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto, RegistrationQueryDto } from './dto/visitor-registration.dto';
import * as qrcode from 'qrcode';

@Injectable()
export class VisitorRegistrationsService {
  constructor(private prisma: PrismaService) {}

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

  async register(user: any, dto: CreateRegistrationDto) {
    const { unitId, propertyNodeId, ...rest } = dto;
    const targetNodeId = propertyNodeId || unitId;
    const organizationId = user.organizationId;

    if (!targetNodeId) {
      throw new BadRequestException('Property Node or Unit ID is required for visitor registration.');
    }

    const isOrgAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.isPlatformAdmin;

    if (!isOrgAdmin && (user.roles?.includes('RESIDENT') || user.roles?.includes('UNIT_OWNER') || user.roles?.includes('TENANT'))) {
      const propertyNodeIds = await this.getResidentPropertyNodeIds(user);
      if (!propertyNodeIds.includes(targetNodeId)) {
        throw new ForbiddenException('You do not have permission to register a visitor for this unit.');
      }
    }

    const registration = await this.prisma.visitorRegistration.create({
      data: {
        ...rest,
        propertyNodeId: targetNodeId,
        organizationId,
        requiresParking: dto.requiresParking,
        vehiclePlate: dto.vehiclePlate,
      },
    });

    let allocatedSlotInfo: any = null;

    if (dto.requiresParking) {
      // Auto-assign an available VISITOR (or STANDARD) slot
      const availableSlot = await this.prisma.parkingSlot.findFirst({
        where: {
          organizationId,
          status: 'AVAILABLE',
          type: 'VISITOR',
        },
        include: { area: true },
      }) || await this.prisma.parkingSlot.findFirst({
        where: {
          organizationId,
          status: 'AVAILABLE',
          type: 'STANDARD',
        },
        include: { area: true },
      });

      if (availableSlot) {
        await this.prisma.parkingAllocation.create({
          data: {
            organizationId,
            slotId: availableSlot.id,
            propertyNodeId: targetNodeId,
            visitorId: dto.visitorId,
            allocationType: 'VISITOR',
            isActive: true,
          }
        });

        await this.prisma.parkingSlot.update({
          where: { id: availableSlot.id },
          data: { status: 'OCCUPIED' }
        });

        allocatedSlotInfo = {
          slotId: availableSlot.id,
          slotNumber: availableSlot.slotNumber,
          areaName: availableSlot.area?.name || 'Visitor Parking',
          type: availableSlot.type,
        };
      }
    }

    const qrData = Buffer.from(registration.id).toString('base64');
    const qrCodeImage = await qrcode.toDataURL(qrData);

    return {
      registration,
      qrCodeImage,
      qrData,
      allocatedSlot: allocatedSlotInfo,
    };
  }

  async findAll(user: any, query: RegistrationQueryDto) {
    const { propertyNodeId, unitId, purpose, skip, take } = query;
    let targetNodeId = propertyNodeId || unitId;
    const organizationId = user.organizationId;

    const isOrgAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.isPlatformAdmin;
    let authorizedNodeIds: string[] | undefined = undefined;

    if (!isOrgAdmin && (user.roles?.includes('RESIDENT') || user.roles?.includes('UNIT_OWNER') || user.roles?.includes('TENANT'))) {
      authorizedNodeIds = await this.getResidentPropertyNodeIds(user);
      if (authorizedNodeIds.length === 0) {
        return { data: [], meta: { total: 0, skip, take } };
      }
      
      // If resident requests a specific node, verify ownership
      if (targetNodeId && !authorizedNodeIds.includes(targetNodeId)) {
        throw new ForbiddenException('You do not have permission to view registrations for this unit.');
      }
    }

    let finalPropertyFilter: any = {};
    if (targetNodeId) {
      finalPropertyFilter = { propertyNodeId: targetNodeId };
    } else if (authorizedNodeIds) {
      finalPropertyFilter = { propertyNodeId: { in: authorizedNodeIds } };
    }

    const where = {
      organizationId,
      ...finalPropertyFilter,
      ...(purpose ? { purpose } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.visitorRegistration.findMany({
        where,
        skip,
        take,
        include: {
          visitor: true,
          propertyNode: {
            include: {
              parent: { include: { parent: true } }
            }
          },
          logs: true
        },
        orderBy: { expectedArrival: 'desc' },
      }),
      this.prisma.visitorRegistration.count({ where }),
    ]);

    const itemsWithQr = await Promise.all(
      items.map(async (item) => {
        const qrData = Buffer.from(item.id).toString('base64');
        let qrCodeImage = '';
        try {
          qrCodeImage = await qrcode.toDataURL(qrData);
        } catch (e) {
          console.error('Failed to generate QR code for registration', item.id, e);
        }
        return {
          ...item,
          qrData,
          qrCodeImage,
        };
      })
    );

    return { data: itemsWithQr, meta: { total, skip, take } };
  }

  async getPass(user: any, id: string) {
    const isOrgAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.isPlatformAdmin;

    const registration = await this.prisma.visitorRegistration.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        visitor: true,
        propertyNode: {
          include: {
            parent: { include: { parent: true } }
          }
        },
        logs: true
      }
    });

    if (!registration) {
      throw new NotFoundException(`Visitor registration with ID ${id} not found`);
    }

    if (!isOrgAdmin && (user.roles?.includes('RESIDENT') || user.roles?.includes('UNIT_OWNER') || user.roles?.includes('TENANT'))) {
      const propertyNodeIds = await this.getResidentPropertyNodeIds(user);
      if (!propertyNodeIds.includes(registration.propertyNodeId)) {
        throw new ForbiddenException('You do not have permission to view this visitor pass.');
      }
    }

    const qrData = Buffer.from(registration.id).toString('base64');
    const qrCodeImage = await qrcode.toDataURL(qrData);

    return {
      ...registration,
      qrData,
      qrCodeImage,
    };
  }

  async verifyQr(organizationId: string, qrData: string) {
    try {
      const registrationId = Buffer.from(qrData, 'base64').toString('utf-8');
      
      const registration = await this.prisma.visitorRegistration.findFirst({
        where: { id: registrationId, organizationId },
        include: { visitor: true, propertyNode: true }
      });

      if (!registration) throw new NotFoundException('Invalid QR code');
      
      return { valid: true, registration };
    } catch (e) {
      throw new BadRequestException('Invalid QR format');
    }
  }

  async checkIn(organizationId: string, registrationId: string, notes?: string) {
    const reg = await this.prisma.visitorRegistration.findFirst({
      where: { id: registrationId, organizationId }
    });
    if (!reg) throw new NotFoundException('Registration not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.visitorRegistration.update({
        where: { id: registrationId },
        data: { status: 'APPROVED' }
      });

      return tx.visitorLog.create({
        data: {
          registrationId,
          checkInTime: new Date(),
          notes
        }
      });
    });
  }

  async checkOut(organizationId: string, logId: string, notes?: string) {
    const log = await this.prisma.visitorLog.findFirst({
      where: { id: logId, registration: { organizationId } }
    });
    if (!log) throw new NotFoundException('Log not found');

    return this.prisma.visitorLog.update({
      where: { id: logId },
      data: {
        checkOutTime: new Date(),
        notes: notes ? notes : log.notes
      }
    });
  }
}
