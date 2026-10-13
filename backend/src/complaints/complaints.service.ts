import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto, UpdateComplaintDto, ComplaintQueryDto } from './dto/complaint.dto';
import { CreateCommentDto } from './dto/complaint-comment.dto';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, creatorId: string, dto: CreateComplaintDto) {
    let propertyNodeId = dto.propertyNodeId;

    if (!propertyNodeId) {
      // Auto-assign propertyNodeId based on user's Owner or Tenant record matching their email
      const user = await this.prisma.user.findUnique({ where: { id: creatorId } });
      if (user) {
        const owner = await this.prisma.owner.findFirst({ where: { email: user.email, organizationId } });
        if (owner) {
          propertyNodeId = owner.propertyNodeId;
        } else {
          const tenant = await this.prisma.tenant.findFirst({ where: { email: user.email, organizationId } });
          if (tenant) {
            propertyNodeId = tenant.propertyNodeId;
          }
        }
      }
    }

    return this.prisma.complaint.create({
      data: {
        ...dto,
        propertyNodeId,
        organizationId,
        creatorId,
      },
    });
  }

  async findAll(organizationId: string, query: ComplaintQueryDto) {
    const { propertyNodeId, categoryId, creatorId, status, priority, search, skip, take } = query;

    const where = {
      organizationId,
      ...(propertyNodeId ? { propertyNodeId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(creatorId ? { creatorId } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as any } },
          { description: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          propertyNode: true
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  private getAccessFilter(user: any) {
    const isOrgAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.isPlatformAdmin;
    if (isOrgAdmin) return {};

    if (user.roles?.includes('RESIDENT') || user.roles?.includes('TENANT')) {
      return { creatorId: user.id };
    }
    
    if (user.roles?.includes('TECHNICIAN')) {
      return { assignedToId: user.id };
    }

    // Default fallback: only access own created items if no privileged role is detected
    return { creatorId: user.id };
  }

  async findOne(user: any, id: string) {
    const accessFilter = this.getAccessFilter(user);
    
    const complaint = await this.prisma.complaint.findFirst({
      where: { id, organizationId: user.organizationId, ...accessFilter },
      include: {
        category: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        propertyNode: true,
        comments: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' }
        },
        attachments: true,
        history: { orderBy: { createdAt: 'desc' } },
        workOrders: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            plan: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async updateStatus(user: any, id: string, dto: UpdateComplaintDto) {
    const existing = await this.findOne(user, id);
    
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status: dto.status,
          priority: dto.priority,
          title: dto.title,
          description: dto.description,
          categoryId: dto.categoryId,
          assignedToId: dto.assignedToId,
          feedbackRating: dto.feedbackRating,
          feedbackText: dto.feedbackText,
        }
      });

      if (dto.status && dto.status !== existing.status) {
        await tx.complaintHistory.create({
          data: {
            complaintId: id,
            statusFrom: existing.status,
            statusTo: dto.status,
            notes: dto.notes,
          }
        });
      }

      return updated;
    });
  }

  async addComment(user: any, id: string, dto: CreateCommentDto) {
    await this.findOne(user, id);

    return this.prisma.complaintComment.create({
      data: {
        complaintId: id,
        userId: user.id,
        content: dto.content
      }
    });
  }

  async uploadAttachment(user: any, id: string, fileUrl: string, fileName: string) {
    await this.findOne(user, id);

    return this.prisma.complaintAttachment.create({
      data: {
        complaintId: id,
        fileUrl,
        fileName
      }
    });
  }

  async getStatistics(user: any) {
    const accessFilter = this.getAccessFilter(user);
    const where = { organizationId: user.organizationId, ...accessFilter };

    const countsByStatus = await this.prisma.complaint.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    });

    const countsByPriority = await this.prisma.complaint.groupBy({
      by: ['priority'],
      where,
      _count: { id: true }
    });

    return {
      statusStats: countsByStatus,
      priorityStats: countsByPriority,
    };
  }

  async remove(user: any, id: string) {
    const existing = await this.findOne(user, id);
    if (!existing) {
      throw new NotFoundException('Complaint not found');
    }
    
    return this.prisma.$transaction(async (tx) => {
      // Delete any associated work orders first to avoid foreign key constraints
      await tx.workOrder.deleteMany({
        where: { complaintId: id }
      });
      
      // Then delete the complaint itself
      // (comments, attachments, history will cascade automatically)
      return tx.complaint.delete({
        where: { id }
      });
    });
  }
}
