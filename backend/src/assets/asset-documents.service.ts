import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDocumentDto } from './dto/asset-document.dto';

@Injectable()
export class AssetDocumentsService {
  constructor(private prisma: PrismaService) {}

  async addDocument(organizationId: string, dto: CreateAssetDocumentDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: dto.assetId, organizationId }
    });

    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.assetDocument.create({
      data: {
        assetId: dto.assetId,
        title: dto.title,
        fileUrl: dto.fileUrl
      }
    });
  }

  async removeDocument(organizationId: string, id: string) {
    const doc = await this.prisma.assetDocument.findFirst({
      where: { id, asset: { organizationId } }
    });

    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.assetDocument.delete({ where: { id } });
  }
}
