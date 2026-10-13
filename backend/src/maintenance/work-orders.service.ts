import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderQueryDto, AddHistoryDto } from './dto/work-order.dto';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateWorkOrderDto) {
    let checklistData: { taskName: string }[] = [];

    if (dto.planId) {
      const plan = await this.prisma.maintenancePlan.findFirst({
        where: { id: dto.planId, organizationId },
        include: { checklists: true }
      });
      if (!plan) throw new NotFoundException('Associated maintenance plan not found');

      checklistData = plan.checklists.map(c => ({
        taskName: c.taskName,
      }));
    }

    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          organizationId,
          title: dto.title,
          description: dto.description,
          planId: dto.planId,
          priority: dto.priority,
          assignedToId: dto.assignedToId,
          woNumber: dto.woNumber,
          complaintId: dto.complaintId,
          propertyNodeId: dto.propertyNodeId,
          residentId: dto.residentId,
          assetId: dto.assetId,
          facilityBookingId: dto.facilityBookingId,
          estimatedHours: dto.estimatedHours,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          checklists: {
            create: checklistData
          }
        },
        include: { checklists: true }
      });

      if (dto.complaintId) {
        await tx.complaint.update({
          where: { id: dto.complaintId },
          data: { status: ComplaintStatus.WORK_ORDER_CREATED }
        });
        
        await tx.complaintHistory.create({
          data: {
            complaintId: dto.complaintId,
            statusFrom: ComplaintStatus.NEW,
            statusTo: ComplaintStatus.WORK_ORDER_CREATED,
            notes: `Work Order created: ${wo.title}`
          }
        });
      }

      if (dto.assignedToId) {
        await tx.notification.create({
          data: {
            organizationId,
            userId: dto.assignedToId,
            title: 'New Work Order Assigned',
            message: `You have been assigned to work order: ${wo.title}`,
            type: 'IN_APP',
          }
        });
      }

      return wo;
    });
  }

  async findAll(organizationId: string, query: WorkOrderQueryDto) {
    const { status, assignedToId, search, skip, take } = query;

    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as any } },
          { description: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take,
        include: { 
          plan: { select: { title: true } },
          propertyNode: { select: { name: true } },
          resident: { select: { firstName: true, lastName: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.workOrder.count({ where })
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, organizationId },
      include: {
        checklists: true,
        history: { orderBy: { createdAt: 'desc' } },
        plan: true,
        complaint: true,
        propertyNode: true,
        resident: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        asset: true
      }
    });

    if (!workOrder) throw new NotFoundException('Work order not found');
    return workOrder;
  }

  async update(organizationId: string, id: string, dto: UpdateWorkOrderDto) {
    const workOrder = await this.findOne(organizationId, id);
    
    return this.prisma.$transaction(async (tx) => {
      let completedAt = workOrder.completedAt;
      if (dto.status === 'COMPLETED' && workOrder.status !== 'COMPLETED') {
        completedAt = new Date();
      }

      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          ...dto,
          completedAt
        }
      });

      if (dto.status && dto.status !== workOrder.status) {
        await tx.maintenanceHistory.create({
          data: {
            workOrderId: id,
            notes: `Status changed to ${dto.status}`,
          }
        });

        // Automatically synchronize linked Complaint status when Work Order progresses
        if (workOrder.complaintId && workOrder.complaint) {
          let newComplaintStatus: ComplaintStatus | undefined;
          let syncNotes: string | undefined;

          if (dto.status === 'IN_PROGRESS') {
            newComplaintStatus = ComplaintStatus.IN_PROGRESS;
            syncNotes = `Technician commenced active repairs on Work Order: ${workOrder.title}`;
          } else if (dto.status === 'ON_HOLD') {
            newComplaintStatus = ComplaintStatus.ON_HOLD;
            syncNotes = `Maintenance Work Order placed on hold: ${workOrder.title}`;
          } else if (dto.status === 'WAITING_PARTS' as any) {
            newComplaintStatus = ComplaintStatus.WAITING_FOR_PARTS;
            syncNotes = `Maintenance awaiting replacement parts for Work Order: ${workOrder.title}`;
          } else if (dto.status === 'COMPLETED') {
            newComplaintStatus = ComplaintStatus.RESOLVED;
            syncNotes = `Work Order completed by maintenance staff (${workOrder.title}). Automatically marked RESOLVED for resident verification.`;
          } else if (dto.status === 'CLOSED') {
            newComplaintStatus = ComplaintStatus.CLOSED;
            syncNotes = `Work Order closed and verified (${workOrder.title}). Complaint permanently archived as CLOSED.`;
          }

          if (newComplaintStatus && workOrder.complaint.status !== newComplaintStatus) {
            await tx.complaint.update({
              where: { id: workOrder.complaintId },
              data: { status: newComplaintStatus }
            });

            await tx.complaintHistory.create({
              data: {
                complaintId: workOrder.complaintId,
                statusFrom: workOrder.complaint.status,
                statusTo: newComplaintStatus,
                notes: syncNotes
              }
            });
          }
        }

        const residentId = workOrder.residentId || workOrder.complaint?.creatorId;
        if (residentId) {
          await tx.notification.create({
            data: {
              organizationId,
              userId: residentId,
              title: dto.status === 'COMPLETED' ? 'Work Order Completed & Complaint Resolved' : 'Work Order Updated',
              message: dto.status === 'COMPLETED'
                ? `Maintenance repairs for "${workOrder.title}" have been completed! Your complaint has been marked as RESOLVED.`
                : `The status of maintenance work order "${workOrder.title}" has been updated to ${dto.status}`,
              type: 'IN_APP',
            }
          });
        }
      }

      return updated;
    });
  }

  async toggleChecklist(organizationId: string, id: string, checklistId: string, isCompleted: boolean) {
    await this.findOne(organizationId, id);

    const checklist = await this.prisma.workOrderChecklist.findFirst({
      where: { id: checklistId, workOrderId: id }
    });

    if (!checklist) throw new NotFoundException('Checklist item not found');

    return this.prisma.workOrderChecklist.update({
      where: { id: checklistId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });
  }

  async addHistory(organizationId: string, id: string, dto: AddHistoryDto) {
    await this.findOne(organizationId, id);

    return this.prisma.maintenanceHistory.create({
      data: {
        workOrderId: id,
        notes: dto.notes
      }
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.findOne(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Work order not found');
    }
    return this.prisma.workOrder.delete({
      where: { id }
    });
  }
}
