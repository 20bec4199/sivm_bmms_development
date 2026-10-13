import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async createRole(organizationId: string, name: string, description?: string) {
    const existing = await this.prisma.role.findUnique({
      where: { organizationId_name: { organizationId, name } },
    });
    if (existing) {
      throw new ConflictException(`Role ${name} already exists in this organization`);
    }

    return this.prisma.role.create({
      data: {
        organizationId,
        name,
        description,
      },
    });
  }

  async findAllRoles(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        rolePermissions: {
          include: { permission: true }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ subject: 'asc' }, { action: 'asc' }]
    });
  }

  async assignPermissionToRole(organizationId: string, roleId: string, permissionId: string, adminId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId }
    });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } }
    });
    if (existing) return existing;

    const res = await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        grantedById: adminId
      }
    });

    await this.invalidateUsersByRole(roleId);
    return res;
  }

  async removePermissionFromRole(organizationId: string, roleId: string, permissionId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId }
    });
    if (!role) throw new NotFoundException('Role not found');

    const res = await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } }
    });

    await this.invalidateUsersByRole(roleId);
    return res;
  }

  async assignRoleToUser(organizationId: string, userId: string, roleId: string, adminId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId }
    });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } }
    });
    if (existing) return existing;

    const res = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedById: adminId
      }
    });

    await this.redisService.invalidateAllUserSessions(userId);
    return res;
  }

  async removeRoleFromUser(organizationId: string, userId: string, roleId: string) {
    const res = await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } }
    });
    await this.redisService.invalidateAllUserSessions(userId);
    return res;
  }

  private async invalidateUsersByRole(roleId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true }
    });
    
    // Invalidate sessions for all users who have this role
    await Promise.all(userRoles.map(ur => this.redisService.invalidateAllUserSessions(ur.userId)));
  }
}
