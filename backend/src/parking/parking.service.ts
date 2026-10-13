import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateParkingAreaDto, 
  CreateParkingSlotDto, 
  AllocateParkingSlotDto, 
  CreateParkingViolationDto,
  GateCheckInDto,
  GateCheckOutDto,
  UpdateParkingConfigurationDto,
  CreateParkingRuleDto,
  CreateParkingReservationDto,
  CreateParkingPermitDto,
  CreateParkingRateDto,
  RecordParkingAccessEventDto,
  UpdateParkingBayStatusDto,
  UpdateViolationWorkflowDto,
  ParkingSessionEntryDto,
  ParkingSessionExitDto
} from './dto/parking.dto';
import * as qrcode from 'qrcode';

@Injectable()
export class ParkingService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Parking Areas ---
  async getParkingAreas(organizationId: string) {
    return this.prisma.parkingArea.findMany({
      where: { organizationId },
      include: {
        slots: {
          include: {
            allocations: {
              where: { isActive: true },
              include: { user: true, vehicle: true, visitor: true }
            }
          }
        },
        propertyNode: {
          include: {
            parent: {
              include: {
                parent: {
                  include: {
                    parent: true
                  }
                }
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createParkingArea(organizationId: string, dto: CreateParkingAreaDto) {
    let targetNode: any = null;

    if (dto.propertyNodeId) {
      targetNode = await this.prisma.propertyNode.findFirst({
        where: { id: dto.propertyNodeId, organizationId },
        include: {
          parkingAreas: true,
          parkingAllocations: { where: { isActive: true } },
          owners: true,
          tenants: true,
        }
      });
      if (!targetNode) {
        throw new NotFoundException('Selected spatial node/unit was not found in your organization.');
      }

      // Strict Exclusivity checks
      if (targetNode.parkingAreas && targetNode.parkingAreas.length > 0) {
        throw new BadRequestException('This spatial node/unit is already allocated to another parking area.');
      }
      if (targetNode.status === 'PARKING_ALLOCATED') {
        throw new BadRequestException('This spatial node/unit is already dedicated to parking.');
      }
      if (targetNode.owners && targetNode.owners.length > 0) {
        throw new BadRequestException('This unit is already assigned to a property owner and cannot be allocated as a parking area.');
      }
      if (targetNode.tenants && targetNode.tenants.length > 0) {
        throw new BadRequestException('This unit is currently leased to a tenant and cannot be allocated as a parking area.');
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const area = await prisma.parkingArea.create({
        data: {
          ...dto,
          organizationId,
        },
        include: {
          propertyNode: {
            include: {
              parent: {
                include: {
                  parent: {
                    include: {
                      parent: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Lock the property node exclusively as parking
      if (dto.propertyNodeId && targetNode) {
        const existingMeta = typeof targetNode.metadata === 'object' && targetNode.metadata !== null 
          ? (targetNode.metadata as any) 
          : {};

        await prisma.propertyNode.update({
          where: { id: dto.propertyNodeId },
          data: {
            status: 'PARKING_ALLOCATED',
            metadata: {
              ...existingMeta,
              isParkingArea: true,
              parkingAreaId: area.id,
              parkingAreaName: area.name,
              allocatedAt: new Date().toISOString(),
            }
          }
        });
      }

      return area;
    });
  }

  async deleteParkingArea(organizationId: string, id: string) {
    const area = await this.prisma.parkingArea.findFirst({
      where: { id, organizationId },
      include: {
        slots: {
          include: {
            allocations: { where: { isActive: true } }
          }
        }
      }
    });
    if (!area) {
      throw new NotFoundException('Parking area not found in your organization');
    }

    const hasActiveAllocations = area.slots.some(s => s.allocations.length > 0);
    if (hasActiveAllocations) {
      throw new BadRequestException('Cannot delete a parking area that contains active slot allocations. Release all bays first.');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Revert the property node if it was locked
      if (area.propertyNodeId) {
        const node = await prisma.propertyNode.findUnique({
          where: { id: area.propertyNodeId }
        });
        if (node) {
          const existingMeta = typeof node.metadata === 'object' && node.metadata !== null 
            ? ({ ...(node.metadata as any) })
            : {};
          delete existingMeta.isParkingArea;
          delete existingMeta.parkingAreaId;
          delete existingMeta.parkingAreaName;
          delete existingMeta.allocatedAt;

          await prisma.propertyNode.update({
            where: { id: area.propertyNodeId },
            data: {
              status: 'ACTIVE',
              metadata: existingMeta,
            }
          });
        }
      }

      return prisma.parkingArea.delete({
        where: { id }
      });
    });
  }

  // --- Parking Slots ---
  async getParkingSlots(organizationId: string, areaId?: string) {
    return this.prisma.parkingSlot.findMany({
      where: {
        organizationId,
        ...(areaId && { areaId }),
      },
      include: {
        area: {
          include: {
            propertyNode: {
              include: {
                parent: {
                  include: {
                    parent: {
                      include: {
                        parent: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        allocations: {
          where: { isActive: true },
          include: { user: true, vehicle: true, visitor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createParkingSlot(organizationId: string, dto: CreateParkingSlotDto) {
    const area = await this.prisma.parkingArea.findFirst({
      where: { id: dto.areaId, organizationId }
    });
    if (!area) throw new NotFoundException('Parking area not found in your organization');

    return this.prisma.parkingSlot.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async deleteParkingSlot(organizationId: string, id: string) {
    const slot = await this.prisma.parkingSlot.findFirst({
      where: { id, organizationId },
      include: {
        allocations: { where: { isActive: true } }
      }
    });
    if (!slot) {
      throw new NotFoundException('Parking slot not found in your organization');
    }
    if (slot.allocations.length > 0 || slot.status === 'OCCUPIED') {
      throw new BadRequestException('Cannot delete an occupied parking slot. Please deallocate or release the bay first.');
    }

    return this.prisma.parkingSlot.delete({
      where: { id }
    });
  }

  // --- Parking Allocations ---
  async allocateSlot(organizationId: string, dto: AllocateParkingSlotDto) {
    const slot = await this.prisma.parkingSlot.findFirst({ 
      where: { id: dto.slotId, organizationId } 
    });
    if (!slot) throw new NotFoundException('Slot not found in your organization');
    if (slot.status !== 'AVAILABLE') throw new BadRequestException('Slot is not available');

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, organizationId }
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found in your organization');
    }
    
    if (dto.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: dto.userId, organizationId }
      });
      if (!user) throw new NotFoundException('User not found in your organization');
    }
    
    if (dto.visitorId) {
      const visitor = await this.prisma.visitor.findFirst({
        where: { id: dto.visitorId, organizationId }
      });
      if (!visitor) throw new NotFoundException('Visitor not found in your organization');
    }

    if (dto.propertyNodeId) {
      const property = await this.prisma.propertyNode.findFirst({
        where: { id: dto.propertyNodeId, organizationId }
      });
      if (!property) throw new NotFoundException('Property not found in your organization');
    }

    // Use transaction to update slot status and create allocation
    return this.prisma.$transaction(async (prisma) => {
      const allocation = await prisma.parkingAllocation.create({
        data: {
          ...dto,
          organizationId,
          isActive: true,
        },
      });

      await prisma.parkingSlot.update({
        where: { id: dto.slotId },
        data: { status: 'OCCUPIED' },
      });

      // Also create history entry for check-in
      await prisma.parkingHistory.create({
        data: {
          organizationId,
          slotId: dto.slotId,
          vehicleId: dto.vehicleId,
          status: 'ACTIVE',
        }
      });

      return allocation;
    });
  }

  async deallocateSlot(organizationId: string, allocationId: string) {
    const allocation = await this.prisma.parkingAllocation.findFirst({
      where: { id: allocationId, organizationId },
      include: { slot: true },
    });
    if (!allocation) {
      throw new NotFoundException('Allocation not found in your organization');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.parkingAllocation.update({
        where: { id: allocationId },
        data: { isActive: false, endDate: new Date() },
      });

      await prisma.parkingSlot.update({
        where: { id: allocation.slotId },
        data: { status: 'AVAILABLE' },
      });

      // Update history entry for check-out
      const history = await prisma.parkingHistory.findFirst({
        where: { slotId: allocation.slotId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      });
      if (history) {
        await prisma.parkingHistory.update({
          where: { id: history.id },
          data: { checkOutTime: new Date(), status: 'COMPLETED' },
        });
      }
    });

    return { success: true, message: 'Parking slot released successfully' };
  }

  // --- Violations ---
  async getViolations(organizationId: string) {
    return this.prisma.parkingViolation.findMany({
      where: { organizationId },
      include: {
        slot: true,
        vehicle: true,
        reportedBy: true,
      },
    });
  }

  async reportViolation(organizationId: string, reportedById: string, dto: CreateParkingViolationDto) {
    if (dto.slotId) {
      const slot = await this.prisma.parkingSlot.findFirst({
        where: { id: dto.slotId, organizationId }
      });
      if (!slot) throw new NotFoundException('Slot not found in your organization');
    }

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, organizationId }
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found in your organization');
    }

    return this.prisma.parkingViolation.create({
      data: {
        ...dto,
        organizationId,
        reportedById,
      },
    });
  }

  // --- Resident Self-Service ---
  private async getResidentPropertyNodeIds(user: any): Promise<string[]> {
    const userId = typeof user === 'string' ? user : user?.id;
    const userEmail = typeof user === 'object' ? user?.email : undefined;

    const [upNodes, owners, tenants]: [any[], any[], any[]] = await Promise.all([
      userId
        ? this.prisma.userPropertyNode.findMany({
            where: { userId },
            select: { propertyNodeId: true }
          })
        : Promise.resolve([] as any[]),
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
      }),
    ]);

    const ids = new Set<string>();
    upNodes.forEach((n: any) => ids.add(n.propertyNodeId));
    owners.forEach(o => ids.add(o.propertyNodeId));
    tenants.forEach(t => ids.add(t.propertyNodeId));

    return Array.from(ids);
  }

  async getMyParking(user: any) {
    const organizationId = user.organizationId;
    const residentNodeIds = await this.getResidentPropertyNodeIds(user);
    const userId = user.id || user.userId;

    const [allocations, vehicles, visitorPasses, units] = await Promise.all([
      this.prisma.parkingAllocation.findMany({
        where: {
          organizationId,
          isActive: true,
          OR: [
            ...(residentNodeIds.length > 0 ? [{ propertyNodeId: { in: residentNodeIds } }] : []),
            ...(userId ? [{ userId }] : []),
          ]
        },
        include: {
          slot: {
            include: {
              area: {
                include: {
                  propertyNode: {
                    include: {
                      parent: {
                        include: {
                          parent: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          vehicle: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.vehicle.findMany({
        where: {
          organizationId,
          ...(residentNodeIds.length > 0 ? { propertyNodeId: { in: residentNodeIds } } : {}),
        },
        include: {
          propertyNode: true,
          parkingAllocations: { where: { isActive: true }, include: { slot: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.visitorRegistration.findMany({
        where: {
          organizationId,
          requiresParking: true,
          ...(residentNodeIds.length > 0 ? { propertyNodeId: { in: residentNodeIds } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      residentNodeIds.length > 0
        ? this.prisma.propertyNode.findMany({
            where: { id: { in: residentNodeIds }, organizationId },
            include: { parent: { include: { parent: true } } }
          })
        : [],
    ]);

    return {
      allocations,
      vehicles,
      visitorPasses,
      units,
    };
  }

  // --- Gate Terminal Barrier Check-In & Check-Out ---
  async gateCheckIn(organizationId: string, dto: GateCheckInDto) {
    let targetSlot: any = null;

    if (dto.slotId) {
      targetSlot = await this.prisma.parkingSlot.findFirst({
        where: { id: dto.slotId, organizationId },
        include: { area: true }
      });
      if (!targetSlot) throw new NotFoundException('Selected parking slot not found.');
      if (targetSlot.status !== 'AVAILABLE') throw new BadRequestException(`Slot ${targetSlot.slotNumber} is already occupied.`);
    } else {
      // Auto-assign: first look for VISITOR slots, then fallback to STANDARD
      targetSlot = await this.prisma.parkingSlot.findFirst({
        where: { organizationId, status: 'AVAILABLE', type: 'VISITOR' },
        include: { area: true }
      });

      if (!targetSlot) {
        targetSlot = await this.prisma.parkingSlot.findFirst({
          where: { organizationId, status: 'AVAILABLE', type: 'STANDARD' },
          include: { area: true }
        });
      }

      if (!targetSlot) {
        throw new BadRequestException('No available visitor or standard parking bays in the property. Parking is at full capacity.');
      }
    }

    // Check if vehicle exists or link plate
    let vehicle = await this.prisma.vehicle.findFirst({
      where: { organizationId, licensePlate: { equals: dto.licensePlate.trim(), mode: 'insensitive' } }
    });

    return this.prisma.$transaction(async (prisma) => {
      // If vehicle doesn't exist, create a temporary gate visitor vehicle record if propertyNodeId provided
      if (!vehicle && dto.propertyNodeId) {
        vehicle = await prisma.vehicle.create({
          data: {
            organizationId,
            propertyNodeId: dto.propertyNodeId,
            licensePlate: dto.licensePlate.trim().toUpperCase(),
            make: dto.visitorName ? `Visitor (${dto.visitorName})` : 'Visitor Guest',
          }
        });
      }

      const allocation = await prisma.parkingAllocation.create({
        data: {
          organizationId,
          slotId: targetSlot.id,
          vehicleId: vehicle ? vehicle.id : undefined,
          propertyNodeId: dto.propertyNodeId || undefined,
          allocationType: 'VISITOR',
          isActive: true,
        },
        include: {
          slot: { include: { area: true } }
        }
      });

      await prisma.parkingSlot.update({
        where: { id: targetSlot.id },
        data: { status: 'OCCUPIED' }
      });

      await prisma.parkingHistory.create({
        data: {
          organizationId,
          slotId: targetSlot.id,
          vehicleId: vehicle ? vehicle.id : undefined,
          status: 'ACTIVE',
        }
      });

      return {
        success: true,
        message: `Vehicle ${dto.licensePlate.trim().toUpperCase()} admitted and assigned to Bay ${targetSlot.slotNumber}`,
        slot: targetSlot,
        allocation,
      };
    });
  }

  async gateCheckOut(organizationId: string, dto: GateCheckOutDto) {
    const slot = await this.prisma.parkingSlot.findFirst({
      where: { id: dto.slotId, organizationId },
      include: {
        allocations: { where: { isActive: true }, include: { vehicle: true } }
      }
    });

    if (!slot) throw new NotFoundException('Parking slot not found in your organization.');

    const activeAllocation = slot.allocations[0];

    return this.prisma.$transaction(async (prisma) => {
      if (activeAllocation) {
        await prisma.parkingAllocation.update({
          where: { id: activeAllocation.id },
          data: { isActive: false, endDate: new Date() }
        });
      }

      await prisma.parkingSlot.update({
        where: { id: slot.id },
        data: { status: 'AVAILABLE' }
      });

      const activeHistory = await prisma.parkingHistory.findFirst({
        where: { slotId: slot.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      });

      if (activeHistory) {
        await prisma.parkingHistory.update({
          where: { id: activeHistory.id },
          data: { status: 'COMPLETED', checkOutTime: new Date() }
        });
      }

      return {
        success: true,
        message: `Slot ${slot.slotNumber} released successfully. Gate barrier open.`,
        slotNumber: slot.slotNumber
      };
    });
  }

  // ==========================================
  // --- PARKORA PLATFORM CONFIGURATION ENGINE ---
  // ==========================================
  async getConfiguration(organizationId: string) {
    let config = await this.prisma.parkingConfiguration.findUnique({
      where: { organizationId }
    });

    if (!config) {
      config = await this.prisma.parkingConfiguration.create({
        data: {
          organizationId,
          parkingMode: 'RESIDENTIAL',
          allocationModel: 'DEDICATED',
          visitorParkingEnabled: true,
          reservationEnabled: true,
          paidParkingEnabled: false,
          evParkingEnabled: true,
          qrAccessEnabled: true,
          rfidAccessEnabled: true,
          anprEnabled: true,
          temporaryParkingEnabled: true,
          violationsEnabled: true,
          subscriptionsEnabled: false,
          dynamicPricingEnabled: false,
        }
      });
    }

    return config;
  }

  async updateConfiguration(organizationId: string, dto: UpdateParkingConfigurationDto) {
    return this.prisma.parkingConfiguration.upsert({
      where: { organizationId },
      create: {
        ...dto,
        organizationId,
      },
      update: {
        ...dto,
      }
    });
  }

  // ==========================================
  // --- PARKORA CONFIGURABLE RULE ENGINE ---
  // ==========================================
  async getRules(organizationId: string) {
    return this.prisma.parkingRule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createRule(organizationId: string, dto: CreateParkingRuleDto) {
    return this.prisma.parkingRule.create({
      data: {
        ...dto,
        organizationId,
      }
    });
  }

  async deleteRule(organizationId: string, id: string) {
    return this.prisma.parkingRule.delete({
      where: { id }
    });
  }

  // ==========================================
  // --- PARKORA INTERACTIVE VISUAL PARKING MAP ---
  // ==========================================
  async getVisualMap(organizationId: string, filters?: any) {
    const where: any = { organizationId };
    if (filters?.areaId && filters.areaId !== 'ALL') where.areaId = filters.areaId;
    if (filters?.type && filters.type !== 'ALL') where.type = filters.type;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

    const [areas, slots] = await Promise.all([
      this.prisma.parkingArea.findMany({
        where: { organizationId },
        include: { propertyNode: { include: { parent: true } } },
        orderBy: { name: 'asc' }
      }),
      this.prisma.parkingSlot.findMany({
        where,
        include: {
          area: true,
          allocations: {
            where: { isActive: true },
            include: { vehicle: true, user: true, propertyNode: true }
          },
          reservations: {
            where: {
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              endTime: { gte: new Date() }
            },
            take: 1,
            orderBy: { startTime: 'asc' }
          }
        },
        orderBy: { slotNumber: 'asc' }
      })
    ]);

    const summary = {
      total: slots.length,
      available: slots.filter(s => s.status === 'AVAILABLE').length,
      occupied: slots.filter(s => s.status === 'OCCUPIED').length,
      reserved: slots.filter(s => s.status === 'RESERVED').length,
      blocked: slots.filter(s => s.status === 'BLOCKED').length,
      maintenance: slots.filter(s => s.status === 'MAINTENANCE').length,
      evCount: slots.filter(s => s.type === 'EV_CHARGING' || s.isEv).length,
      accessibleCount: slots.filter(s => s.type === 'HANDICAPPED' || s.isAccessible).length,
      visitorCount: slots.filter(s => s.type === 'VISITOR').length,
    };

    return {
      areas,
      slots,
      summary
    };
  }

  async updateSlotStatus(organizationId: string, slotId: string, dto: UpdateParkingBayStatusDto) {
    const slot = await this.prisma.parkingSlot.findFirst({
      where: { id: slotId, organizationId }
    });
    if (!slot) throw new NotFoundException('Slot not found in your organization');

    return this.prisma.parkingSlot.update({
      where: { id: slotId },
      data: {
        status: dto.status,
        maintenanceStatus: dto.maintenanceStatus,
        notes: dto.notes,
      }
    });
  }

  // ==========================================
  // --- PARKORA PARKING SESSIONS & TIMELINE ---
  // ==========================================
  async getSessions(organizationId: string, query?: any) {
    const where: any = { organizationId };
    if (query?.status) where.sessionStatus = query.status;
    if (query?.licensePlate) where.licensePlate = { contains: query.licensePlate, mode: 'insensitive' };

    return this.prisma.parkingSession.findMany({
      where,
      include: {
        slot: true,
        area: true,
        vehicle: true,
        user: true,
      },
      orderBy: { entryTime: 'desc' },
      take: 100,
    });
  }

  async createSessionEntry(organizationId: string, dto: ParkingSessionEntryDto) {
    const plate = dto.licensePlate.trim().toUpperCase();

    // Auto find slot if not provided
    let slotId = dto.slotId;
    let areaId = dto.areaId;

    if (!slotId) {
      const openSlot = await this.prisma.parkingSlot.findFirst({
        where: { organizationId, status: 'AVAILABLE', type: 'VISITOR' },
        include: { area: true }
      }) || await this.prisma.parkingSlot.findFirst({
        where: { organizationId, status: 'AVAILABLE' },
        include: { area: true }
      });

      if (openSlot) {
        slotId = openSlot.id;
        areaId = openSlot.areaId;
      }
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { organizationId, licensePlate: { equals: plate, mode: 'insensitive' } }
    });

    return this.prisma.$transaction(async (prisma) => {
      if (slotId) {
        await prisma.parkingSlot.update({
          where: { id: slotId },
          data: { status: 'OCCUPIED' }
        });
      }

      const session = await prisma.parkingSession.create({
        data: {
          organizationId,
          licensePlate: plate,
          slotId,
          areaId,
          vehicleId: vehicle?.id,
          accessPoint: dto.accessPoint || 'Main Gate Barrier',
          entryMethod: dto.entryMethod || 'MANUAL',
          sessionStatus: 'ACTIVE',
          entryTime: new Date(),
        },
        include: { slot: true, area: true }
      });

      // Record access event
      await prisma.parkingAccessEvent.create({
        data: {
          organizationId,
          eventType: 'VEHICLE_ENTRY',
          source: dto.entryMethod || 'MANUAL',
          licensePlate: plate,
          bayCode: session.slot?.slotNumber,
          payload: { sessionId: session.id },
        }
      });

      return session;
    });
  }

  async createSessionExit(organizationId: string, dto: ParkingSessionExitDto) {
    const plate = dto.licensePlate.trim().toUpperCase();

    const activeSession = await this.prisma.parkingSession.findFirst({
      where: { organizationId, licensePlate: { equals: plate, mode: 'insensitive' }, sessionStatus: 'ACTIVE' },
      include: { slot: true }
    });

    if (!activeSession) {
      throw new NotFoundException(`No active parking session found for vehicle plate '${plate}'.`);
    }

    const exitTime = new Date();
    const durationMinutes = Math.max(1, Math.round((exitTime.getTime() - new Date(activeSession.entryTime).getTime()) / (1000 * 60)));

    // Rate calculation
    const activeRate = await this.prisma.parkingRate.findFirst({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    let totalAmount = 0.0;
    if (activeRate && activeRate.rateType !== 'FREE') {
      const gracePeriod = activeRate.gracePeriodMinutes || 15;
      if (durationMinutes > gracePeriod) {
        if (activeRate.rateType === 'FLAT') {
          totalAmount = activeRate.baseAmount;
        } else if (activeRate.rateType === 'HOURLY') {
          const hours = Math.ceil(durationMinutes / 60);
          totalAmount = activeRate.baseAmount + (hours * (activeRate.hourlyRate || 0));
          if (activeRate.maxDailyAmount && totalAmount > activeRate.maxDailyAmount) {
            totalAmount = activeRate.maxDailyAmount;
          }
        }
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      if (activeSession.slotId) {
        await prisma.parkingSlot.update({
          where: { id: activeSession.slotId },
          data: { status: 'AVAILABLE' }
        });
      }

      const closedSession = await prisma.parkingSession.update({
        where: { id: activeSession.id },
        data: {
          exitTime,
          durationMinutes,
          exitMethod: dto.exitMethod || 'MANUAL',
          totalAmount,
          paymentStatus: totalAmount > 0 ? 'PENDING' : 'WAIVED',
          sessionStatus: 'COMPLETED',
        },
        include: { slot: true }
      });

      await prisma.parkingAccessEvent.create({
        data: {
          organizationId,
          eventType: 'VEHICLE_EXIT',
          source: dto.exitMethod || 'MANUAL',
          licensePlate: plate,
          bayCode: activeSession.slot?.slotNumber,
          payload: { sessionId: closedSession.id, durationMinutes, totalAmount },
        }
      });

      return closedSession;
    });
  }

  // ==========================================
  // --- PARKORA RESERVATIONS ---
  // ==========================================
  async getReservations(organizationId: string, query?: any) {
    return this.prisma.parkingReservation.findMany({
      where: { organizationId },
      include: {
        slot: { include: { area: true } },
        area: true,
        vehicle: true,
        user: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async createReservation(organizationId: string, userId: string, dto: CreateParkingReservationDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('Reservation start time must be before end time.');
    }

    if (dto.slotId) {
      // Check for overlap
      const overlap = await this.prisma.parkingReservation.findFirst({
        where: {
          organizationId,
          slotId: dto.slotId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          OR: [
            { startTime: { lte: start }, endTime: { gt: start } },
            { startTime: { lt: end }, endTime: { gte: end } },
            { startTime: { gte: start }, endTime: { lte: end } },
          ]
        }
      });

      if (overlap) {
        throw new BadRequestException('This slot is already reserved for the selected timeframe.');
      }
    }

    const reservation = await this.prisma.parkingReservation.create({
      data: {
        organizationId,
        userId: userId || undefined,
        vehicleId: dto.vehicleId || undefined,
        slotId: dto.slotId || undefined,
        areaId: dto.areaId || undefined,
        startTime: start,
        endTime: end,
        parkingType: dto.parkingType || 'STANDARD',
        notes: dto.notes,
        status: 'CONFIRMED',
      }
    });

    const qrData = Buffer.from(`RESERVATION:${reservation.id}`).toString('base64');
    const qrCode = await qrcode.toDataURL(qrData);

    return this.prisma.parkingReservation.update({
      where: { id: reservation.id },
      data: { qrCode }
    });
  }

  // ==========================================
  // --- PARKORA DIGITAL PERMITS ---
  // ==========================================
  async getPermits(organizationId: string, query?: any) {
    return this.prisma.parkingPermit.findMany({
      where: { organizationId },
      include: {
        slot: { include: { area: true } },
        vehicle: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPermit(organizationId: string, dto: CreateParkingPermitDto) {
    const permitNumber = `PRK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrData = Buffer.from(`PERMIT:${permitNumber}`).toString('base64');
    const qrCode = await qrcode.toDataURL(qrData);

    return this.prisma.parkingPermit.create({
      data: {
        organizationId,
        permitNumber,
        permitType: dto.permitType || 'RESIDENT',
        userId: dto.userId || undefined,
        vehicleId: dto.vehicleId || undefined,
        slotId: dto.slotId || undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        status: 'ACTIVE',
        qrCode,
        metadata: dto.metadata || {},
      },
      include: {
        slot: true,
        vehicle: true,
        user: true,
      }
    });
  }

  // ==========================================
  // --- PARKORA RATE CARDS & PRICING ---
  // ==========================================
  async getRates(organizationId: string) {
    return this.prisma.parkingRate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRate(organizationId: string, dto: CreateParkingRateDto) {
    return this.prisma.parkingRate.create({
      data: {
        ...dto,
        organizationId,
      }
    });
  }

  // ==========================================
  // --- PARKORA ACCESS INTEGRATION LAYER ---
  // ==========================================
  async recordAccessEvent(organizationId: string, dto: RecordParkingAccessEventDto) {
    return this.prisma.parkingAccessEvent.create({
      data: {
        ...dto,
        organizationId,
      }
    });
  }

  // ==========================================
  // --- PARKORA VIOLATION WORKFLOW ---
  // ==========================================
  async updateViolationWorkflow(organizationId: string, violationId: string, dto: UpdateViolationWorkflowDto) {
    const violation = await this.prisma.parkingViolation.findFirst({
      where: { id: violationId, organizationId }
    });
    if (!violation) throw new NotFoundException('Violation record not found.');

    return this.prisma.parkingViolation.update({
      where: { id: violationId },
      data: {
        status: dto.status,
        actionTaken: dto.actionTaken,
        resolvedAt: dto.status === 'RESOLVED' || dto.status === 'DISMISSED' ? new Date() : undefined,
      }
    });
  }

  // ==========================================
  // --- PARKORA ANALYTICS DASHBOARD ---
  // ==========================================
  async getAnalytics(organizationId: string, filters?: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [slots, activeSessions, todaySessions, violations, areas] = await Promise.all([
      this.prisma.parkingSlot.findMany({ where: { organizationId } }),
      this.prisma.parkingSession.findMany({ where: { organizationId, sessionStatus: 'ACTIVE' } }),
      this.prisma.parkingSession.findMany({ where: { organizationId, entryTime: { gte: today } } }),
      this.prisma.parkingViolation.findMany({ where: { organizationId } }),
      this.prisma.parkingArea.findMany({ where: { organizationId } })
    ]);

    const totalSlots = slots.length;
    const occupied = slots.filter(s => s.status === 'OCCUPIED').length;
    const available = slots.filter(s => s.status === 'AVAILABLE').length;
    const reserved = slots.filter(s => s.status === 'RESERVED').length;
    const blocked = slots.filter(s => s.status === 'BLOCKED').length;
    const maintenance = slots.filter(s => s.status === 'MAINTENANCE').length;
    const occupancyRate = totalSlots > 0 ? Math.round((occupied / totalSlots) * 100) : 0;

    const todayEntries = todaySessions.length;
    const todayExits = todaySessions.filter(s => s.sessionStatus === 'COMPLETED').length;
    const todayRevenue = todaySessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const activeViolations = violations.filter(v => v.status === 'REPORTED' || v.status === 'UNDER_REVIEW').length;

    return {
      totalSlots,
      occupied,
      available,
      reserved,
      blocked,
      maintenance,
      occupancyRate,
      todayEntries,
      todayExits,
      todayRevenue,
      activeViolations,
      activeSessionsCount: activeSessions.length,
      totalZones: areas.length,
    };
  }
}
