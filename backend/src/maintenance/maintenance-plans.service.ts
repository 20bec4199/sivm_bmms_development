import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenancePlanDto, UpdateMaintenancePlanDto } from './dto/maintenance-plan.dto';

@Injectable()
export class MaintenancePlansService {
  private readonly logger = new Logger(MaintenancePlansService.name);

  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateMaintenancePlanDto) {
    const { checklists, ...planData } = dto;

    const createdPlan = await this.prisma.maintenancePlan.create({
      data: {
        organizationId,
        title: planData.title,
        planCode: planData.planCode || `PMP-${Date.now().toString().slice(-6)}`,
        description: planData.description,
        category: planData.category || 'HVAC & Air Distribution Subsystems',
        maintenanceType: planData.maintenanceType || 'Preventive',
        priority: (planData.priority || 'MEDIUM') as any,
        status: planData.status || 'ACTIVE',
        frequency: planData.frequency || 'MONTHLY',
        nextDueDate: planData.nextDueDate ? new Date(planData.nextDueDate) : new Date(Date.now() + 86400000 * 30),
        buildingId: planData.buildingId || null,
        towerId: planData.towerId || null,
        floorId: planData.floorId || null,
        unitId: planData.unitId || null,
        locationScope: planData.locationScope || 'PROPERTY',
        spatialNodes: planData.spatialNodes || undefined,
        locationName: planData.locationName || null,
        facilityIds: planData.facilityIds || [],
        assetIds: planData.assetIds || [],
        targetAssetCategory: planData.targetAssetCategory || null,
        scheduleConfig: planData.scheduleConfig || undefined,
        assignmentConfig: planData.assignmentConfig || undefined,
        blackoutConfig: planData.blackoutConfig || undefined,
        lifecycleConfig: planData.lifecycleConfig || undefined,
        complianceScore: planData.complianceScore ?? 100.0,
        complianceStats: planData.complianceStats || { totalScheduled: 1, onTime: 1, overdue: 0, failed: 0, skipped: 0, completionRate: 100 },
        checklists: checklists && checklists.length > 0 ? {
          create: checklists.map(c => ({
            taskName: c.taskName,
            description: c.description || null,
            instructions: c.instructions || null,
            sequence: c.sequence ?? 1,
            taskCategory: c.taskCategory || 'Safety & Inspection',
            taskType: c.taskType || 'CHECKBOX',
            options: c.options || [],
            isMandatory: c.isMandatory ?? true,
            photoRequired: c.photoRequired ?? false,
            signatureRequired: c.signatureRequired ?? false,
            supervisorSignoff: c.supervisorSignoff ?? false,
            estimatedDurationMinutes: c.estimatedDurationMinutes ?? 15,
            config: c.config || undefined,
          }))
        } : undefined
      },
      include: { checklists: true }
    });

    // Automatically synchronize facility maintenance blocks if linked to facilities
    await this.syncFacilityBlackoutBlocks(organizationId, createdPlan);

    return createdPlan;
  }

  async findAll(organizationId: string) {
    return this.prisma.maintenancePlan.findMany({
      where: { organizationId },
      include: { 
        checklists: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(organizationId: string, id: string) {
    const plan = await this.prisma.maintenancePlan.findFirst({
      where: { id, organizationId },
      include: { 
        checklists: {
          orderBy: { sequence: 'asc' }
        }, 
        workOrders: { 
          orderBy: { createdAt: 'desc' }, 
          take: 20,
          include: { assignedTo: true, checklists: true }
        } 
      }
    });

    if (!plan) throw new NotFoundException('Maintenance plan not found');
    return plan;
  }

  async update(organizationId: string, id: string, dto: UpdateMaintenancePlanDto) {
    await this.findOne(organizationId, id);
    const { checklists, ...planData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (checklists) {
        await tx.maintenanceChecklist.deleteMany({ where: { planId: id } });
      }

      const updated = await tx.maintenancePlan.update({
        where: { id },
        data: {
          title: planData.title,
          planCode: planData.planCode,
          description: planData.description,
          category: planData.category,
          maintenanceType: planData.maintenanceType,
          priority: planData.priority ? (planData.priority as any) : undefined,
          status: planData.status,
          frequency: planData.frequency,
          nextDueDate: planData.nextDueDate ? new Date(planData.nextDueDate) : undefined,
          buildingId: planData.buildingId !== undefined ? planData.buildingId : undefined,
          towerId: planData.towerId !== undefined ? planData.towerId : undefined,
          floorId: planData.floorId !== undefined ? planData.floorId : undefined,
          unitId: planData.unitId !== undefined ? planData.unitId : undefined,
          locationScope: planData.locationScope,
          spatialNodes: planData.spatialNodes || undefined,
          locationName: planData.locationName,
          facilityIds: planData.facilityIds,
          assetIds: planData.assetIds,
          targetAssetCategory: planData.targetAssetCategory,
          scheduleConfig: planData.scheduleConfig || undefined,
          assignmentConfig: planData.assignmentConfig || undefined,
          blackoutConfig: planData.blackoutConfig || undefined,
          lifecycleConfig: planData.lifecycleConfig || undefined,
          complianceScore: planData.complianceScore,
          complianceStats: planData.complianceStats || undefined,
          checklists: checklists ? {
            create: checklists.map((c, i) => ({
              taskName: c.taskName,
              description: c.description || null,
              instructions: c.instructions || null,
              sequence: c.sequence ?? (i + 1),
              taskCategory: c.taskCategory || 'Safety & Inspection',
              taskType: c.taskType || 'CHECKBOX',
              options: c.options || [],
              isMandatory: c.isMandatory ?? true,
              photoRequired: c.photoRequired ?? false,
              signatureRequired: c.signatureRequired ?? false,
              supervisorSignoff: c.supervisorSignoff ?? false,
              estimatedDurationMinutes: c.estimatedDurationMinutes ?? 15,
              config: c.config || undefined,
            }))
          } : undefined
        },
        include: { checklists: true }
      });

      await this.syncFacilityBlackoutBlocks(organizationId, updated);
      return updated;
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.maintenancePlan.delete({ where: { id } });
  }

  // Section 8: Automated Work Order Generation with Idempotency Protection
  async generateWorkOrder(organizationId: string, planId: string) {
    const plan = await this.findOne(organizationId, planId);

    if (plan.status === 'PAUSED' || plan.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot generate work order for a paused or archived maintenance plan.');
    }

    // Check Idempotency: Avoid duplicate open/in-progress work orders for the same plan
    const activeStatusList = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CREATED', 'ACCEPTED', 'TRAVELLING', 'WAITING_PARTS'];
    const existingActiveWo = await this.prisma.workOrder.findFirst({
      where: {
        organizationId,
        planId: plan.id,
        status: { in: activeStatusList as any }
      }
    });

    if (existingActiveWo) {
      this.logger.log(`Idempotency verification: Active work order ${existingActiveWo.woNumber} already exists for plan ${plan.title}.`);
      return {
        message: 'Active work order already generated and assigned for this schedule.',
        workOrder: existingActiveWo,
        isExisting: true
      };
    }

    const woNumber = `WO-PMP-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 90 + 10)}`;
    const assignedTechId = (plan.assignmentConfig as any)?.assignedTechnicianId || null;
    const targetAssetId = plan.assetIds && plan.assetIds.length > 0 ? plan.assetIds[0] : null;

    const createdWorkOrder = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          organizationId,
          planId: plan.id,
          woNumber,
          title: `[Preventive Routine] ${plan.title}`,
          description: `Automated maintenance execution for ${plan.locationName || 'Property Assets'}. Regimen: ${plan.frequency} ${plan.category || ''}`,
          status: assignedTechId ? 'ASSIGNED' : 'OPEN',
          priority: plan.priority,
          assignedToId: assignedTechId,
          assetId: targetAssetId,
          propertyNodeId: plan.unitId || plan.floorId || plan.towerId || plan.buildingId || null,
          dueDate: plan.nextDueDate || new Date(Date.now() + 86400000 * 7),
          checklists: {
            create: plan.checklists.map((c: any) => ({
              taskName: c.taskName,
              description: c.description || c.instructions || null,
              taskType: c.taskType || 'CHECKBOX',
              isMandatory: c.isMandatory ?? true,
              photoRequired: c.photoRequired ?? false,
              signatureRequired: c.signatureRequired ?? false,
              supervisorSignoff: c.supervisorSignoff ?? false,
              isCompleted: false
            }))
          },
          history: {
            create: {
              notes: `Work order auto-spawned from preventive schedule '${plan.title}' (${plan.planCode || plan.id}). Technician checklist initialized.`
            }
          }
        },
        include: { checklists: true, history: true }
      });

      // Advance nextDueDate on the plan based on frequency
      const now = new Date();
      let nextDate = plan.nextDueDate ? new Date(plan.nextDueDate) : new Date();
      const freq = (plan.frequency || 'MONTHLY').toUpperCase();

      if (freq === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (freq === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (freq === 'BIWEEKLY') nextDate.setDate(nextDate.getDate() + 14);
      else if (freq === 'QUARTERLY') nextDate.setMonth(nextDate.getMonth() + 3);
      else if (freq === 'ANNUALLY' || freq === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);
      else nextDate.setMonth(nextDate.getMonth() + 1); // MONTHLY default

      await tx.maintenancePlan.update({
        where: { id: plan.id },
        data: {
          nextDueDate: nextDate,
          lastCompletedDate: now
        }
      });

      return wo;
    });

    return {
      message: 'Preventive Work Order generated successfully and technician checklist loaded.',
      workOrder: createdWorkOrder,
      isExisting: false
    };
  }

  // Section 15 & 16: Automated Facility Maintenance Blackout Sync
  private async syncFacilityBlackoutBlocks(organizationId: string, plan: any) {
    if (!plan.facilityIds || plan.facilityIds.length === 0) return;
    const isPausedOrClosed = plan.status === 'PAUSED' || plan.status === 'ARCHIVED';

    for (const facilityId of plan.facilityIds) {
      try {
        const facility = await this.prisma.facility.findFirst({ where: { id: facilityId, organizationId } });
        if (!facility) continue;

        let blocks: any[] = Array.isArray(facility.maintenanceBlocks) ? (facility.maintenanceBlocks as any[]) : [];
        const blockId = `auto_pmp_${plan.id}`;

        // Remove old synced block for this plan if exists
        blocks = blocks.filter(b => b.id !== blockId && b.planId !== plan.id);

        if (!isPausedOrClosed && plan.nextDueDate) {
          const startDate = new Date(plan.nextDueDate);
          const durationHours = (plan.blackoutConfig as any)?.blockDurationHours || 6;
          const endDate = new Date(startDate.getTime() + durationHours * 3600 * 1000);

          blocks.push({
            id: blockId,
            planId: plan.id,
            reason: `[Scheduled Maintenance] ${plan.title}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'SCHEDULED',
            createdDate: new Date().toISOString(),
            autoSynced: true
          });
        }

        await this.prisma.facility.update({
          where: { id: facilityId },
          data: { maintenanceBlocks: blocks }
        });
      } catch (e) {
        this.logger.warn(`Failed to sync maintenance block for facility ${facilityId}: ${e.message}`);
      }
    }
  }
}
