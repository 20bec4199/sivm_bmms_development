import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetCategoryDto } from './dto/asset-category.dto';

@Injectable()
export class AssetCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateAssetCategoryDto) {
    return this.prisma.assetCategory.create({
      data: { ...dto, organizationId }
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.assetCategory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  async remove(organizationId: string, id: string) {
    return this.prisma.assetCategory.delete({
      where: { id, organizationId }
    });
  }
}
