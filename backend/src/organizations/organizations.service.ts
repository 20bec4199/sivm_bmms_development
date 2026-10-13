import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleAccessService } from '../auth/services/module-access.service';
import { RedisService } from '../redis/redis.service';
import { PasswordService } from '../auth/services/password.service';
import { TokenService } from '../auth/services/token.service';
import { EmailService } from '../email/email.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private moduleAccessService: ModuleAccessService,
    private redisService: RedisService,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) {}

  async create(user: any, dto: CreateOrganizationDto) {
    if (!user?.isPlatformAdmin) {
      throw new ForbiddenException('Only Platform Administrators can perform this action.');
    }

    // 1. Validate module dependencies prior to starting transaction
    if (dto.modules && dto.modules.length > 0) {
      await this.moduleAccessService.validateDependencies(dto.modules);
    }

    // 2. Validate email uniqueness if initial admin is provided
    let normalizedAdminEmail: string | null = null;
    if (dto.admin?.email) {
      normalizedAdminEmail = dto.admin.email.toLowerCase().trim();
      const existingUser = await this.prisma.user.findFirst({
        where: { emailNormalized: normalizedAdminEmail },
      });
      if (existingUser) {
        throw new ConflictException(`A user with email "${dto.admin.email}" already exists.`);
      }
    }

    // 3. Execute atomic transaction
    return await this.prisma.$transaction(async (tx) => {
      // A. Create Organization record with full metadata
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          code: dto.code?.toUpperCase() || null,
          type: dto.type || 'Property Management',
          contactEmail: dto.contactEmail || null,
          contactPhone: dto.contactPhone || null,
          contactAddress: dto.contactAddress || null,
          industry: dto.industry || null,
          size: dto.size || null,
          subscriptionPlan: dto.subscriptionPlan || 'Enterprise',
          status: 'ACTIVE',
        },
      });

      // B. Link modules if provided
      if (dto.modules && dto.modules.length > 0) {
        const masterModules = await tx.moduleMaster.findMany({
          where: { code: { in: dto.modules } },
        });
        if (masterModules.length > 0) {
          await tx.organizationModule.createMany({
            data: masterModules.map((m) => ({
              organizationId: org.id,
              moduleId: m.id,
            })),
          });
        }
      }

      // C. Link property categories if provided
      if (dto.propertyCategories && dto.propertyCategories.length > 0) {
        const masterCategories = await tx.propertyCategoryMaster.findMany({
          where: { code: { in: dto.propertyCategories } },
        });
        if (masterCategories.length > 0) {
          await tx.organizationPropertyCategory.createMany({
            data: masterCategories.map((c) => ({
              organizationId: org.id,
              categoryId: c.id,
            })),
          });
        }
      }

      // D. Seed Tenant Default Roles
      const adminRole = await tx.role.create({
        data: {
          name: 'ORGANIZATION_ADMIN',
          description: 'Organization Administrator with full access to tenant management',
          organizationId: org.id,
          isDefault: true,
        },
      });

      await tx.role.createMany({
        data: [
          {
            name: 'BUILDING_MANAGER',
            description: 'Manager of specific buildings and facilities',
            organizationId: org.id,
            isDefault: false,
          },
          {
            name: 'TECHNICIAN',
            description: 'Maintenance and service staff',
            organizationId: org.id,
            isDefault: false,
          },
          {
            name: 'SECURITY_GUARD',
            description: 'Security staff for visitor access, incidents, and patrols',
            organizationId: org.id,
            isDefault: false,
          },
          {
            name: 'RESIDENT',
            description: 'Community resident and occupant',
            organizationId: org.id,
            isDefault: false,
          },
          {
            name: 'UNIT_OWNER',
            description: 'Deeded Unit Owner',
            organizationId: org.id,
            isDefault: false,
          },
          {
            name: 'TENANT',
            description: 'Lease Occupant / Tenant',
            organizationId: org.id,
            isDefault: false,
          },
        ],
      });

      // E. Associate Administrative Permissions with ORGANIZATION_ADMIN
      const allPermissions = await tx.permission.findMany();
      if (allPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: allPermissions.map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
          })),
        });
      }

      const securityRole = await tx.role.findUnique({
        where: { organizationId_name: { organizationId: org.id, name: 'SECURITY_GUARD' } },
      });
      const securityPermissions = allPermissions.filter((permission) =>
        (permission.subject === 'Incident' && ['READ', 'CREATE', 'UPDATE'].includes(permission.action)) ||
        (permission.subject === 'VisitorRegistration' && ['READ', 'CREATE', 'UPDATE'].includes(permission.action)),
      );
      if (securityRole && securityPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: securityPermissions.map((permission) => ({
            roleId: securityRole.id,
            permissionId: permission.id,
          })),
        });
      }

      let createdAdminUser: any = null;
      let rawToken: string | null = null;

      // F. Provision Initial Primary Administrator if provided
      if (dto.admin && normalizedAdminEmail) {
        const randomSecret = crypto.randomBytes(12).toString('base64');
        const tempPassword = `${randomSecret}A1!`;
        const passwordHash = await this.passwordService.hash(tempPassword);

        createdAdminUser = await tx.user.create({
          data: {
            firstName: dto.admin.firstName,
            lastName: dto.admin.lastName ?? null,
            email: normalizedAdminEmail,
            emailNormalized: normalizedAdminEmail,
            phone: dto.admin.phone ?? null,
            passwordHash,
            organizationId: org.id,
            isActive: true,
            emailVerified: false,
          },
        });

        // Link User to ORGANIZATION_ADMIN role
        await tx.userRole.create({
          data: {
            userId: createdAdminUser.id,
            roleId: adminRole.id,
          },
        });

        // Generate Password Reset / Activation Token
        const emailTokenData = this.tokenService.createEmailToken();
        rawToken = emailTokenData.rawToken;

        await tx.passwordResetToken.create({
          data: {
            userId: createdAdminUser.id,
            tokenHash: emailTokenData.tokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days to activate
            requestedIp: null,
          },
        });
      }

      // G. Non-blocking asynchronous invitation email dispatch
      if (dto.admin && normalizedAdminEmail && rawToken) {
        const setupLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
        this.emailService
          .sendAdminInvitation(
            normalizedAdminEmail,
            dto.admin.firstName,
            org.name,
            setupLink,
          )
          .catch((err) => {
            console.warn(
              `[OrganizationsService] Warning: Could not deliver admin invite email: ${err.message}`,
            );
          });
      }

      return {
        ...org,
        rolesCount: 7,
        adminUser: createdAdminUser
          ? {
              id: createdAdminUser.id,
              firstName: createdAdminUser.firstName,
              lastName: createdAdminUser.lastName,
              email: createdAdminUser.email,
              role: 'ORGANIZATION_ADMIN',
            }
          : null,
      };
    });
  }

  async getActiveModules(organizationId: string) {
    if (!organizationId) return { data: [] };
    const orgModules = await this.prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
        module: { isActive: true },
      },
      include: { module: true },
    });
    
    return { data: orgModules.map(om => ({ code: om.module.code, name: om.module.name })) };
  }

  async findAll(user: any) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        contactEmail: true,
        contactPhone: true,
        contactAddress: true,
        status: true,
        subscriptionPlan: true,
        lastActivityAt: true,
        industry: true,
        size: true,
        deletedAt: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            propertyNodes: true,
            complaints: true,
            workOrders: true,
            owners: true,
            tenants: true,
            technicianProfiles: true,
            assets: true,
            facilities: true,
          }
        },
        users: {
          where: {
            userRoles: { some: { role: { name: 'ORGANIZATION_ADMIN' } } },
            deletedAt: null,
          },
          take: 1,
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    return { 
      data: orgs.map(org => {
        const totalUsers = org._count.users || 0;
        const totalBuildings = org._count.propertyNodes || 0;
        const totalResidents = (org._count.owners || 0) + (org._count.tenants || 0);
        const totalTechnicians = org._count.technicianProfiles || 0;
        const admin = org.users && org.users.length > 0 ? org.users[0] : null;

        return {
          ...org,
          code: org.code || `ORG-${org.id.slice(0, 6).toUpperCase()}`,
          type: org.type || 'Property & Asset Management',
          status: org.status || (org.deletedAt ? 'INACTIVE' : 'ACTIVE'),
          subscriptionPlan: org.subscriptionPlan || 'Enterprise Multi-Tenant',
          lastActivityAt: org.lastActivityAt || org.createdAt,
          contactEmail: org.contactEmail || (admin ? admin.email : 'No Email Recorded'),
          contactPhone: org.contactPhone || (admin ? admin.phone : 'No Phone Recorded'),
          contactAddress: org.contactAddress || 'No Address Recorded',
          organizationAdmin: admin ? {
            name: `${admin.firstName} ${admin.lastName || ''}`.trim() || 'Assigned Admin',
            email: admin.email,
            phone: admin.phone || 'N/A',
            role: 'Organization Admin'
          } : {
            name: 'No Admin Assigned',
            email: org.contactEmail || 'N/A',
            phone: org.contactPhone || 'N/A',
            role: 'Pending Assignment'
          },
          metrics: {
            totalBuildings,
            totalUsers,
            activeUsers: totalUsers,
            totalResidents,
            totalTechnicians,
            totalComplaints: org._count.complaints || 0,
            totalWorkOrders: org._count.workOrders || 0,
            totalAssets: org._count.assets || 0,
            totalFacilities: org._count.facilities || 0,
          }
        };
      })
    };
  }

  async findOne(user: any, id: string) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        modules: {
          include: { module: true }
        },
        propertyCategories: {
          include: { category: true }
        },
        packages: {
          where: { isActive: true },
          include: { 
            package: {
              include: { packageModules: { include: { module: true } } }
            } 
          }
        },
        addons: {
          where: { isActive: true },
          include: { module: true }
        }
      }
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    
    // Map them cleanly for the frontend
    const mappedOrg = {
      ...org,
      status: org.deletedAt ? 'INACTIVE' : 'ACTIVE',
      modules: org.modules.map(m => ({ id: m.module.code, label: m.module.name })),
      propertyCategories: org.propertyCategories.map(c => ({ id: c.category.code, label: c.category.name })),
      packages: org.packages.map(p => ({
        id: p.package.id,
        code: p.package.code,
        name: p.package.name,
        modules: p.package.packageModules.map(pm => pm.module.code)
      })),
      addons: org.addons.map(a => ({
        id: a.module.id,
        code: a.module.code,
        name: a.module.name
      }))
    };
    
    return { 
      data: mappedOrg
    };
  }

  async update(user: any, id: string, data: any) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException(`Organization with ID ${id} not found`);

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.industry !== undefined ? { industry: data.industry } : {}),
        ...(data.size !== undefined ? { size: data.size } : {}),
      }
    });

    if (data.modules !== undefined) {
      if (data.modules.length > 0) {
        await this.moduleAccessService.validateDependencies(data.modules);
      }
      
      // Remove old
      await this.prisma.organizationModule.deleteMany({ where: { organizationId: id } });
      if (data.modules.length > 0) {
        const masterModules = await this.prisma.moduleMaster.findMany({
          where: { code: { in: data.modules } }
        });
        await this.prisma.organizationModule.createMany({
          data: masterModules.map(m => ({ organizationId: id, moduleId: m.id }))
        });
      }
    }

    if (data.propertyCategories !== undefined) {
      // Remove old
      await this.prisma.organizationPropertyCategory.deleteMany({ where: { organizationId: id } });
      if (data.propertyCategories.length > 0) {
        const masterCategories = await this.prisma.propertyCategoryMaster.findMany({
          where: { code: { in: data.propertyCategories } }
        });
        await this.prisma.organizationPropertyCategory.createMany({
          data: masterCategories.map(c => ({ organizationId: id, categoryId: c.id }))
        });
      }
    }

    return { data: updated };
  }

  async remove(user: any, id: string) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException(`Organization with ID ${id} not found`);

    // Thanks to onDelete: Cascade on the Prisma Schema, this single delete command
    // will recursively delete all users, properties, complaints, and data attached to this Organization.
    await this.prisma.organization.delete({
      where: { id }
    });

    return { success: true, message: `Organization ${id} and all related data deleted successfully.` };
  }

  async getUsers(user: any, id: string) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const users = await this.prisma.user.findMany({
      where: { organizationId: id },
      include: {
        userRoles: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: u.isActive,
        isPermanentlyLocked: u.isPermanentlyLocked,
        lockedUntil: u.lockedUntil,
        failedLoginCount: u.failedLoginCount,
        createdAt: u.createdAt,
        roles: u.userRoles.map(ur => ur.role.name)
      }))
    };
  }

  async updateUser(user: any, orgId: string, userId: string, data: any) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const targetUser = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId }
    });
    if (!targetUser) throw new NotFoundException('User not found in this organization');
    
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.isPermanentlyLocked !== undefined ? { isPermanentlyLocked: data.isPermanentlyLocked } : {}),
        ...(data.lockedUntil !== undefined ? { lockedUntil: data.lockedUntil } : {}),
        ...(data.failedLoginCount !== undefined ? { failedLoginCount: data.failedLoginCount } : {})
      }
    });
  }

  async removeUser(user: any, orgId: string, userId: string) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const targetUser = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId }
    });
    if (!targetUser) throw new NotFoundException('User not found in this organization');

    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async updateStatus(user: any, id: string, status: string) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status, lastActivityAt: new Date() }
    });

    return { data: updated, message: `Organization status updated to ${status}` };
  }

  async assignPackage(user: any, orgId: string, packageId: string) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const pkg = await this.prisma.packageMaster.findUnique({
      where: { id: packageId },
      include: {
        packageModules: {
          include: { module: true }
        }
      }
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Assign package safely in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.organizationPackage.updateMany({
        where: { organizationId: orgId },
        data: { isActive: false }
      });

      await tx.organizationPackage.upsert({
        where: {
          organizationId_packageId: {
            organizationId: orgId,
            packageId: packageId
          }
        },
        update: { isActive: true },
        create: {
          organizationId: orgId,
          packageId: packageId,
          isActive: true
        }
      });
    });

    await this.recalculateEffectiveModules(orgId);

    return { success: true, message: `Package ${pkg.name} successfully assigned.` };
  }

  async recalculateEffectiveModules(orgId: string) {
    const activePackage = await this.prisma.organizationPackage.findFirst({
      where: { organizationId: orgId, isActive: true },
      include: {
        package: {
          include: {
            packageModules: { include: { module: true } }
          }
        }
      }
    });

    const packageModuleCodes = activePackage?.package.packageModules.map(pm => pm.module.code) || [];

    const activeAddons = await this.prisma.organizationAddon.findMany({
      where: { organizationId: orgId, isActive: true },
      include: { module: true }
    });

    const addonModuleCodes = activeAddons.map(a => a.module.code);

    const allModuleCodes = Array.from(new Set([...packageModuleCodes, ...addonModuleCodes]));

    await this.moduleAccessService.updateOrganizationModules(orgId, allModuleCodes);

    // Invalidate session cache for all users in this organization so they pick up new modules
    const orgUsers = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true }
    });
    if (this.redisService) {
      await Promise.all(orgUsers.map(u => this.redisService.invalidateAllUserSessions(u.id)));
    }
  }

  async assignAddons(user: any, orgId: string, moduleIds: string[]) {
    if (!user?.isPlatformAdmin) throw new ForbiddenException('Only Platform Administrators can perform this action.');

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationAddon.updateMany({
        where: { organizationId: orgId },
        data: { isActive: false }
      });

      for (const moduleId of moduleIds) {
        await tx.organizationAddon.upsert({
          where: {
            organizationId_moduleId: {
              organizationId: orgId,
              moduleId: moduleId
            }
          },
          update: { isActive: true },
          create: {
            organizationId: orgId,
            moduleId: moduleId,
            isActive: true
          }
        });
      }
    });

    await this.recalculateEffectiveModules(orgId);
    return { success: true, message: 'Addons successfully updated.' };
  }
}

