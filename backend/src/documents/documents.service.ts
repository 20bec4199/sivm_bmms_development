import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private storageService: StorageService) {}

  async upload(organizationId: string, userId: string, dto: CreateDocumentDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    
    const fileUrl = await this.storageService.uploadFile(file);

    return this.prisma.document.create({
      data: {
        organizationId,
        uploadedById: userId,
        categoryId: dto.categoryId,
        title: dto.title,
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        version: 1
      }
    });
  }

  async uploadNewVersion(organizationId: string, id: string, userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    
    const existing = await this.prisma.document.findFirst({
      where: { id, organizationId }
    });

    if (!existing) throw new NotFoundException('Document not found');

    const fileUrl = await this.storageService.uploadFile(file);

    return this.prisma.document.update({
      where: { id },
      data: {
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        version: existing.version + 1,
        uploadedById: userId
      }
    });
  }

  async findAll(organizationId: string, query: DocumentQueryDto) {
    const { categoryId, search, skip, take } = query;

    const where = {
      organizationId,
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' as any } } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.document.count({ where })
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async getFileStream(organizationId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId }
    });

    if (!document) throw new NotFoundException('Document not found');

    return this.storageService.getFileStream(document.fileUrl);
  }

  async remove(organizationId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId }
    });

    if (!document) throw new NotFoundException('Document not found');

    return this.prisma.document.delete({ where: { id } });
  }
}
