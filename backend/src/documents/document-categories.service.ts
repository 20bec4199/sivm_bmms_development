import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentCategoryDto } from './dto/document-category.dto';

@Injectable()
export class DocumentCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateDocumentCategoryDto) {
    return this.prisma.documentCategory.create({
      data: { ...dto, organizationId }
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.documentCategory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  async remove(organizationId: string, id: string) {
    return this.prisma.documentCategory.delete({
      where: { id, organizationId }
    });
  }
}
