import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintCategoryDto } from './dto/complaint-category.dto';

@Injectable()
export class ComplaintCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateComplaintCategoryDto) {
    return this.prisma.complaintCategory.create({
      data: { ...dto, organizationId }
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.complaintCategory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  async remove(organizationId: string, id: string) {
    return this.prisma.complaintCategory.delete({
      where: { id, organizationId }
    });
  }
}
