import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { AuditAction } from '@prisma/client';
import * as argon2 from 'argon2';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(organizationId: string, currentUserId: string, createUserDto: CreateUserDto) {
    const { email, password, roleIds, ...rest } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const isSecurityGuard = roleIds?.length
      ? Boolean(await this.prisma.role.findFirst({
          where: { id: { in: roleIds }, organizationId, name: 'SECURITY_GUARD' },
          select: { id: true },
        }))
      : false;

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email,
        emailNormalized: email.toLowerCase().trim(),
        passwordHash,
        organizationId,
        ...(isSecurityGuard ? { emailVerified: true, emailVerifiedAt: new Date() } : {}),
        ...(roleIds && roleIds.length > 0 ? {
          userRoles: {
            create: roleIds.map(roleId => ({ roleId }))
          }
        } : {})
      },
      include: {
        userRoles: { include: { role: true } }
      }
    });

    await this.logAudit(organizationId, currentUserId, AuditAction.USER_CREATED, user.id, null, user);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(organizationId: string, query: UserQueryDto) {
    const { search, isActive, skip, take } = query;

    const where = {
      organizationId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as any } },
          { lastName: { contains: search, mode: 'insensitive' as any } },
          { email: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true,
          isPermanentlyLocked: true, lockedUntil: true, failedLoginCount: true,
          userRoles: { select: { role: { select: { id: true, name: true } } } },
          userPropertyNodes: { select: { propertyNodeId: true, accessLevel: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, skip, take }
    };
  }

  async findOne(organizationId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true, updatedAt: true,
        userRoles: { select: { role: { select: { id: true, name: true, description: true } } } },
        userPropertyNodes: { select: { propertyNodeId: true, accessLevel: true } }
      }
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(organizationId: string, currentUserId: string, id: string, updateUserDto: UpdateUserDto) {
    const oldUser = await this.findOne(organizationId, id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true, updatedAt: true,
      }
    });

    await this.logAudit(organizationId, currentUserId, AuditAction.USER_UPDATED, id, oldUser, updatedUser);
    return updatedUser;
  }

  async setActivationStatus(organizationId: string, currentUserId: string, id: string, isActive: boolean) {
    const res = await this.update(organizationId, currentUserId, id, { isActive });
    await this.redisService.invalidateAllUserSessions(id);
    return res;
  }

  async remove(organizationId: string, currentUserId: string, id: string) {
    const oldUser = await this.findOne(organizationId, id);

    await this.prisma.user.delete({ where: { id } });
    await this.redisService.invalidateAllUserSessions(id);

    await this.logAudit(organizationId, currentUserId, AuditAction.USER_DELETED, id, oldUser, null);
    return { success: true };
  }

  async assignRoles(organizationId: string, currentUserId: string, id: string, roleIds: string[]) {
    await this.findOne(organizationId, id); // Verify user exists in org

    // Verify roles exist in org
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds }, organizationId }
    });

    if (roles.length !== roleIds.length) {
      throw new ConflictException('One or more roles are invalid or do not belong to the organization');
    }

    // Delete existing roles and assign new ones transactionally
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.userRole.createMany({
        data: roleIds.map(roleId => ({ userId: id, roleId }))
      })
    ]);

    await this.redisService.invalidateAllUserSessions(id);
    await this.logAudit(organizationId, currentUserId, AuditAction.ROLE_ASSIGNED, id, null, { roleIds });
    return { success: true };
  }

  async removeRoles(organizationId: string, currentUserId: string, id: string, roleIds: string[]) {
    await this.findOne(organizationId, id);
    
    await this.prisma.userRole.deleteMany({
      where: {
        userId: id,
        roleId: { in: roleIds }
      }
    });

    await this.redisService.invalidateAllUserSessions(id);
    await this.logAudit(organizationId, currentUserId, AuditAction.ROLE_REVOKED, id, { roleIds }, null);
    return { success: true };
  }

  async assignProperties(organizationId: string, currentUserId: string, id: string, propertyIds: string[]) {
    await this.findOne(organizationId, id);

    const properties = await this.prisma.propertyNode.findMany({
      where: { id: { in: propertyIds }, organizationId }
    });

    if (properties.length !== propertyIds.length) {
      throw new ConflictException('One or more properties are invalid or do not belong to the organization');
    }

    await this.prisma.$transaction([
      this.prisma.userPropertyNode.deleteMany({ where: { userId: id, accessLevel: 'MANAGER' } }),
      this.prisma.userPropertyNode.createMany({
        data: propertyIds.map(propertyNodeId => ({
          organizationId,
          userId: id,
          propertyNodeId,
          accessLevel: 'MANAGER'
        }))
      })
    ]);

    await this.logAudit(organizationId, currentUserId, AuditAction.USER_UPDATED, id, null, { propertyIds });
    return { success: true };
  }
  
  async findAllPlatformUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        organization: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        organizationName: u.organization?.name || 'Platform',
        isActive: u.isActive,
        isPermanentlyLocked: u.isPermanentlyLocked,
        lockedUntil: u.lockedUntil,
        failedLoginCount: u.failedLoginCount,
        createdAt: u.createdAt,
      }))
    };
  }

  async setPlatformUserLock(id: string, isPermanentlyLocked: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { 
        isPermanentlyLocked,
        // Reset counters when unlocking
        ...(isPermanentlyLocked ? {} : { lockedUntil: null, failedLoginCount: 0 })
      }
    });
    if (isPermanentlyLocked) {
      await this.redisService.invalidateAllUserSessions(id);
    }
    return updated;
  }

  async setUserLock(organizationId: string, id: string, isPermanentlyLocked: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
    if (!user) throw new NotFoundException('User not found in your organization');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { 
        isPermanentlyLocked,
        // Reset counters when unlocking
        ...(isPermanentlyLocked ? {} : { lockedUntil: null, failedLoginCount: 0 })
      }
    });
    if (isPermanentlyLocked) {
      await this.redisService.invalidateAllUserSessions(id);
    }
    return updated;
  }

  private async logAudit(organizationId: string, actorId: string, action: AuditAction, entityId: string, oldValues: any, newValues: any) {
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
        action,
        entityType: 'User',
        entityId,
        oldValues: oldValues ? (oldValues as any) : undefined,
        newValues: newValues ? (newValues as any) : undefined,
      }
    });
  }
}
