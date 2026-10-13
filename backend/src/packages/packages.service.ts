import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto, PackageQueryDto } from './dto/package.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async getAvailableModules() {
    const modules = await this.prisma.moduleMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { data: modules };
  }

  async create(dto: CreatePackageDto) {
    const existing = await this.prisma.packageMaster.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Package with code ${dto.code} already exists`);
    }

    const pkg = await this.prisma.packageMaster.create({
      data: dto,
    });
    return { data: pkg, message: 'Package created successfully' };
  }

  async findAll(query: PackageQueryDto) {
    const { search, skip, take } = query;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [packages, total] = await Promise.all([
      this.prisma.packageMaster.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { packageModules: true, organizationPackages: true },
          },
        },
      }),
      this.prisma.packageMaster.count({ where }),
    ]);

    return { data: packages, total, skip, take };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.packageMaster.findUnique({
      where: { id },
      include: {
        packageModules: {
          include: { module: true },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package ${id} not found`);
    }

    return { data: pkg };
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id); // Ensure exists

    if (dto.code) {
      const existing = await this.prisma.packageMaster.findUnique({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Package with code ${dto.code} already exists`);
      }
    }

    const pkg = await this.prisma.packageMaster.update({
      where: { id },
      data: dto,
    });
    return { data: pkg, message: 'Package updated successfully' };
  }

  async activate(id: string) {
    const pkg = await this.prisma.packageMaster.update({
      where: { id },
      data: { isActive: true },
    });
    return { data: pkg, message: 'Package activated' };
  }

  async deactivate(id: string) {
    const pkg = await this.prisma.packageMaster.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: pkg, message: 'Package deactivated' };
  }

  async addModule(packageId: string, moduleId: string) {
    const pkg = await this.prisma.packageMaster.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

    const mod = await this.prisma.moduleMaster.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException(`Module ${moduleId} not found`);

    const existing = await this.prisma.packageModule.findUnique({
      where: {
        packageId_moduleId: {
          packageId,
          moduleId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Module ${moduleId} is already in package ${packageId}`);
    }

    const packageModule = await this.prisma.packageModule.create({
      data: {
        packageId,
        moduleId,
      },
      include: { module: true }
    });

    return { data: packageModule, message: 'Module added to package successfully' };
  }

  async removeModule(packageId: string, moduleId: string) {
    const existing = await this.prisma.packageModule.findUnique({
      where: {
        packageId_moduleId: {
          packageId,
          moduleId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Module ${moduleId} is not in package ${packageId}`);
    }

    await this.prisma.packageModule.delete({
      where: { id: existing.id },
    });

    return { success: true, message: 'Module removed from package' };
  }

  async getPackageModules(packageId: string) {
    const pkg = await this.prisma.packageMaster.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

    const modules = await this.prisma.packageModule.findMany({
      where: { packageId },
      include: { module: true },
    });

    return { data: modules };
  }
}
