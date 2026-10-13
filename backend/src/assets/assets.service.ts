import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto } from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateAssetDto) {
    const { categoryId: inputCatId, categoryName, tagNumber, locationNotes, status: inputStatus, ...rest } = dto;

    // 1. Resolve Category ID or Auto-create asset category by name
    let categoryId = inputCatId;
    if (!categoryId || !categoryId.includes('-')) {
      const targetName = categoryName || inputCatId || 'General Facility Equipment';
      let cat = await this.prisma.assetCategory.findFirst({
        where: { organizationId, name: { equals: targetName, mode: 'insensitive' as any } }
      });
      if (!cat) {
        cat = await this.prisma.assetCategory.create({
          data: { organizationId, name: targetName }
        });
      }
      categoryId = cat.id;
    } else {
      const existing = await this.prisma.assetCategory.findFirst({ where: { id: categoryId, organizationId } });
      if (!existing && categoryName) {
        const cat = await this.prisma.assetCategory.create({
          data: { organizationId, name: categoryName }
        });
        categoryId = cat.id;
      }
    }

    // 2. Resolve Status to valid AssetStatus enum
    let resolvedStatus: any = 'ACTIVE';
    if (inputStatus === 'OPERATIONAL' || inputStatus === 'ACTIVE') resolvedStatus = 'ACTIVE';
    else if (inputStatus === 'INACTIVE' || inputStatus === 'OFFLINE') resolvedStatus = 'INACTIVE';
    else if (inputStatus === 'IN_REPAIR' || inputStatus === 'MAINTENANCE') resolvedStatus = 'IN_REPAIR';
    else if (inputStatus === 'DISPOSED' || inputStatus === 'DECOMMISSIONED') resolvedStatus = 'DISPOSED';

    // 3. Resolve Serial / Tag Number and Location
    const location = rest.location || locationNotes || null;
    let serialNumber = rest.serialNumber;
    if (tagNumber) {
      serialNumber = serialNumber ? `TAG: ${tagNumber} | SN: ${serialNumber}` : `TAG: ${tagNumber}`;
    }

    const created = await this.prisma.asset.create({
      data: {
        ...rest,
        organizationId,
        categoryId,
        status: resolvedStatus,
        location,
        serialNumber
      },
      include: { category: true }
    });

    return this.formatAssetResponse(created);
  }

  private formatAssetResponse(asset: any) {
    if (!asset) return null;
    let tagNumber: string | null = null;
    let cleanSerial = asset.serialNumber;
    if (typeof cleanSerial === 'string' && cleanSerial.startsWith('TAG: ')) {
      const parts = cleanSerial.split(' | SN: ');
      tagNumber = parts[0].replace('TAG: ', '').trim();
      cleanSerial = parts.length > 1 ? parts[1].trim() : null;
    }
    return {
      ...asset,
      tagNumber: tagNumber || (cleanSerial && cleanSerial.startsWith('AST-') ? cleanSerial : `AST-${asset.id.substring(0, 6).toUpperCase()}`),
      serialNumber: cleanSerial,
      categoryName: asset.category?.name || 'General Facility Equipment',
      locationNotes: asset.location || 'Central Facility Utility Area',
      statusDisplay: asset.status === 'ACTIVE' ? 'OPERATIONAL' : asset.status
    };
  }

  async findAll(organizationId: string, query: AssetQueryDto) {
    const { categoryId, status, search, skip, take } = query;

    const where = {
      organizationId,
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { serialNumber: { contains: search, mode: 'insensitive' as any } },
          { location: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.asset.count({ where })
    ]);

    const formattedItems = items.map((item) => this.formatAssetResponse(item));

    return { data: formattedItems, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        documents: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!asset) throw new NotFoundException('Asset not found');
    return this.formatAssetResponse(asset);
  }

  async update(organizationId: string, id: string, dto: UpdateAssetDto) {
    await this.findOne(organizationId, id);
    const { categoryId: inputCatId, categoryName, tagNumber, locationNotes, status: inputStatus, ...rest } = dto;

    const data: any = { ...rest };
    if (inputStatus) {
      if (inputStatus === 'OPERATIONAL' || inputStatus === 'ACTIVE') data.status = 'ACTIVE';
      else if (inputStatus === 'INACTIVE' || inputStatus === 'OFFLINE') data.status = 'INACTIVE';
      else if (inputStatus === 'IN_REPAIR' || inputStatus === 'MAINTENANCE') data.status = 'IN_REPAIR';
      else if (inputStatus === 'DISPOSED' || inputStatus === 'DECOMMISSIONED') data.status = 'DISPOSED';
      else data.status = inputStatus;
    }
    if (locationNotes !== undefined) data.location = locationNotes;
    if (inputCatId && inputCatId.includes('-')) {
      data.categoryId = inputCatId;
    } else if (categoryName || (inputCatId && !inputCatId.includes('-'))) {
      const targetName = categoryName || inputCatId;
      let cat = await this.prisma.assetCategory.findFirst({
        where: { organizationId, name: { equals: targetName as string, mode: 'insensitive' as any } }
      });
      if (!cat) {
        cat = await this.prisma.assetCategory.create({
          data: { organizationId, name: targetName as string }
        });
      }
      data.categoryId = cat.id;
    }
    if (tagNumber !== undefined || rest.serialNumber !== undefined) {
      let sn = rest.serialNumber || '';
      if (tagNumber) {
        sn = sn ? `TAG: ${tagNumber} | SN: ${sn}` : `TAG: ${tagNumber}`;
      }
      if (sn) data.serialNumber = sn;
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data,
      include: { category: true }
    });

    return this.formatAssetResponse(updated);
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.asset.delete({ where: { id } });
  }

  async getWarrantyAlerts(organizationId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.prisma.asset.findMany({
      where: {
        organizationId,
        warrantyExpiry: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        }
      },
      include: { category: true }
    });
  }
}
