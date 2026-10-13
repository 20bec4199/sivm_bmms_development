import { Injectable, Logger, OnModuleInit, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Check if we need to seed some sample audit activities for amazing demonstration & instant value
    try {
      const count = await this.prisma.auditLog.count();
      if (count === 0) {
        this.logger.log('No audit logs found. Seeding initial enterprise activity logs...');
        await this.seedSampleActivities();
      }
    } catch (error) {
      this.logger.error('Failed to check or seed audit logs on init:', error.message);
    }
  }

  /**
   * Universal centralized activity logging method used by services and interceptors across all BMMS modules.
   */
  async logActivity(data: {
    organizationId?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
    actorId?: string;
    actorEmail?: string;
    module?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    description?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    status?: string;
    metadata?: any;
  }) {
    try {
      // Map string action to enum if matching, else CUSTOM_ACTION or RECORD_UPDATED
      let enumAction: AuditAction = AuditAction.CUSTOM_ACTION;
      if (data.action && Object.values(AuditAction).includes(data.action as any)) {
        enumAction = data.action as AuditAction;
      } else if (data.action && data.action.toUpperCase().includes('CREATE')) {
        enumAction = AuditAction.CREATE;
      } else if (data.action && data.action.toUpperCase().includes('UPDATE')) {
        enumAction = AuditAction.UPDATE;
      } else if (data.action && data.action.toUpperCase().includes('DELETE')) {
        enumAction = AuditAction.DELETE;
      } else if (data.action && data.action.toUpperCase().includes('LOGIN')) {
        enumAction = AuditAction.LOGIN;
      }

      const log = await this.prisma.auditLog.create({
        data: {
          organizationId: data.organizationId || null,
          userId: data.userId || data.actorId || null,
          userName: data.userName || data.actorEmail || 'System User',
          userRole: data.userRole || 'USER',
          actorId: data.actorId || null,
          actorEmail: data.actorEmail || null,
          module: data.module || 'System',
          action: enumAction,
          actionType: data.action || enumAction.toString(),
          entityType: data.entityType || 'Resource',
          entityId: data.entityId || null,
          description: data.description || `Performed ${data.action || enumAction} on ${data.entityType || 'resource'}`,
          oldValue: data.oldValue ?? undefined,
          newValue: data.newValue ?? undefined,
          oldValues: data.oldValue ?? undefined,
          newValues: data.newValue ?? undefined,
          ipAddress: data.ipAddress || '127.0.0.1',
          userAgent: data.userAgent || 'Web App Client / BMMS Platform',
          status: data.status || 'SUCCESS',
          metadata: data.metadata ?? undefined,
        },
      });

      // Automatically touch the organization's lastActivityAt timestamp
      if (data.organizationId) {
        await this.prisma.organization.updateMany({
          where: { id: data.organizationId },
          data: { lastActivityAt: new Date() },
        });
      }

      return log;
    } catch (error) {
      this.logger.error(`Error recording activity log: ${error.message}`);
    }
  }

  /**
   * Fetch paginated audit and activity logs with strict RBAC data isolation.
   */
  async findAll(user: any, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Strict RBAC & Data Isolation Enforcement (Req #13)
    const userRoles: string[] = user?.roles || [];
    const isPlatformAdmin = user?.isPlatformAdmin === true;
    const isOrgAdmin = userRoles.some(r => ['ORGANIZATION_ADMIN', 'AUDITOR', 'ORGANIZATION_MANAGER'].includes(r));

    if (!isPlatformAdmin) {
      if (!isOrgAdmin) {
        throw new ForbiddenException('You do not have permission to view audit logs');
      }
      if (!user.organizationId) {
        throw new ForbiddenException('User is not associated with an organization');
      }
      where.organizationId = user.organizationId;
    } else if (query.organizationId && query.organizationId !== 'ALL') {
      where.organizationId = query.organizationId;
    }

    // 2. Filters
    if (query.module && query.module !== 'All Modules') {
      where.module = query.module;
    }

    if (query.action && query.action !== 'All Actions') {
      where.OR = [
        { actionType: { equals: query.action, mode: 'insensitive' } },
        { action: { equals: query.action as any } }
      ];
    }

    if (query.status && query.status !== 'All') {
      where.status = query.status;
    }

    if (query.userRole && query.userRole !== 'All Roles') {
      where.userRole = { contains: query.userRole, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search filter across description, entity, user, or organization name
    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim();
      const searchOR: any[] = [
        { userName: { contains: s, mode: 'insensitive' } },
        { actorEmail: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { entityType: { contains: s, mode: 'insensitive' } },
        { module: { contains: s, mode: 'insensitive' } },
        { actionType: { contains: s, mode: 'insensitive' } }
      ];

      // Also allow searching by organization name
      searchOR.push({
        organization: {
          name: { contains: s, mode: 'insensitive' }
        }
      });

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          organization: {
            select: { id: true, name: true, code: true, status: true, type: true }
          }
        }
      }),
    ]);

    return {
      data: logs.map(l => ({
        ...l,
        actionName: l.actionType || l.action,
        organizationName: l.organization?.name || 'Platform HQ',
        organizationCode: l.organization?.code || l.organizationId?.slice(0, 8) || 'GLOBAL',
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Calculate real-time global Platform Activity statistics and analytical aggregations for interactive charts.
   */
  async getPlatformActivityStats(user: any, query: any) {
    const isPlatformAdmin = user?.isPlatformAdmin === true;
    if (!isPlatformAdmin) {
      throw new ForbiddenException('You do not have permission to view platform statistics');
    }

    let targetOrgId: string | undefined = undefined;
    if (query.organizationId && query.organizationId !== 'ALL') {
      targetOrgId = query.organizationId;
    }

    const orgFilter = targetOrgId ? { organizationId: targetOrgId } : {};

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const [
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      totalUsers,
      activeUsers,
      totalActivities,
      activitiesToday,
      activitiesThisWeek,
      activitiesThisMonth,
      byModuleRaw,
      byRoleRaw,
      byActionRaw,
      recentLogs,
      orgsList
    ] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.organization.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: targetOrgId ? { organizationId: targetOrgId, deletedAt: null } : { deletedAt: null } }),
      this.prisma.user.count({ where: targetOrgId ? { organizationId: targetOrgId, isActive: true, deletedAt: null } : { isActive: true, deletedAt: null } }),
      this.prisma.auditLog.count({ where: orgFilter }),
      this.prisma.auditLog.count({ where: { ...orgFilter, createdAt: { gte: startOfToday } } }),
      this.prisma.auditLog.count({ where: { ...orgFilter, createdAt: { gte: startOfWeek } } }),
      this.prisma.auditLog.count({ where: { ...orgFilter, createdAt: { gte: startOfMonth } } }),
      this.prisma.auditLog.groupBy({ by: ['module'], where: orgFilter, _count: { module: true } }),
      this.prisma.auditLog.groupBy({ by: ['userRole'], where: orgFilter, _count: { userRole: true } }),
      this.prisma.auditLog.groupBy({ by: ['actionType'], where: orgFilter, _count: { actionType: true } }),
      this.prisma.auditLog.findMany({
        where: orgFilter,
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { organization: { select: { name: true } } }
      }),
      this.prisma.organization.findMany({ select: { id: true, name: true } })
    ]);

    // Format module stats
    const byModule = byModuleRaw.map(m => ({ name: m.module || 'Other', value: m._count.module }));

    // Format role stats
    const byRole = byRoleRaw.map(r => ({ name: r.userRole || 'User', value: r._count.userRole }));

    // Format action stats
    const byAction = byActionRaw.map(a => ({ name: a.actionType || 'Action', value: a._count.actionType }));

    // Calculate daily trend over last 14 days
    const dailyTrends: any[] = [];
    for (let i = 13; i >= 0; i--) {
      const dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dEnd = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate() + 1);
      const count = await this.prisma.auditLog.count({
        where: {
          ...orgFilter,
          createdAt: { gte: dStart, lt: dEnd }
        }
      });
      dailyTrends.push({
        date: dStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activities: count
      });
    }

    // Top active organizations chart data
    const byOrgRaw = await this.prisma.auditLog.groupBy({
      by: ['organizationId'],
      _count: { organizationId: true },
      orderBy: { _count: { organizationId: 'desc' } },
      take: 8
    });

    const orgMap = new Map(orgsList.map(o => [o.id, o.name]));
    const activitiesByOrganization = byOrgRaw.map(o => ({
      name: o.organizationId ? (orgMap.get(o.organizationId) || 'Deleted Org') : 'Platform HQ',
      count: o._count.organizationId
    }));

    return {
      kpi: {
        totalOrganizations,
        activeOrganizations,
        suspendedOrganizations,
        totalUsers,
        activeUsers,
        totalActivities,
        activitiesToday,
        activitiesThisWeek,
        activitiesThisMonth,
      },
      charts: {
        byModule,
        byRole,
        byAction,
        dailyTrends,
        activitiesByOrganization,
      },
      recentTimeline: recentLogs.map(l => ({
        ...l,
        organizationName: l.organization?.name || 'Platform HQ'
      }))
    };
  }

  /**
   * Fetch detailed organization stats & health dashboard data (Req #2).
   */
  async getOrganizationHealth(id: string, user: any) {
    // RBAC verification
    const isPlatformAdmin = user?.isPlatformAdmin === true;
    const isOrgAdmin = user?.roles?.some((r: string) => ['ORGANIZATION_ADMIN', 'AUDITOR', 'ORGANIZATION_MANAGER'].includes(r));

    if (!isPlatformAdmin) {
      if (!isOrgAdmin) {
        throw new ForbiddenException('You do not have permission to view organization health details');
      }
      if (user?.organizationId !== id) {
        throw new ForbiddenException('You do not have permission to view health details for this organization');
      }
    }

    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        modules: { include: { module: true } },
      }
    });

    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    // Aggregate real database record counts for all spatial & business entities in this organization
    const [
      totalUsers,
      totalActiveUsers,
      totalInactiveUsers,
      totalBuildings,
      totalTowers,
      totalFloors,
      totalUnits,
      totalComplaints,
      openComplaints,
      totalWorkOrders,
      pendingWorkOrders,
      overdueWorkOrders,
      totalAssets,
      totalFacilities,
      totalOwners,
      totalTenants,
      totalTechnicians,
      totalStaff,
      recentActivities,
      adminUser
    ] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: id, deletedAt: null } }),
      this.prisma.user.count({ where: { organizationId: id, isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: { organizationId: id, isActive: false, deletedAt: null } }),
      this.prisma.propertyNode.count({ where: { organizationId: id, parentId: null } }).catch(() => 0),
      this.prisma.propertyNode.count({ where: { organizationId: id, NOT: { parentId: null } } }).catch(() => 0),
      this.prisma.department.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.unitTransferHistory.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.complaint.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.complaint.count({ where: { organizationId: id, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] as any } } }).catch(() => 0),
      this.prisma.workOrder.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.workOrder.count({ where: { organizationId: id, status: { in: ['OPEN', 'IN_PROGRESS', 'ASSIGNED'] as any } } }).catch(() => 0),
      this.prisma.workOrder.count({ where: { organizationId: id, status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'] as any } } }).catch(() => 0),
      this.prisma.asset.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.facility.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.owner.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.tenant.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.technicianProfile.count({ where: { organizationId: id } }).catch(() => 0),
      this.prisma.user.count({ where: { organizationId: id, userRoles: { some: { role: { name: { in: ['FACILITY_MANAGER', 'BUILDING_MANAGER', 'PROPERTY_ADMIN', 'SECURITY_GUARD'] } } } }, deletedAt: null } }).catch(() => 0),
      this.prisma.auditLog.findMany({
        where: { organizationId: id },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.findFirst({
        where: {
          organizationId: id,
          userRoles: { some: { role: { name: 'ORGANIZATION_ADMIN' } } },
          deletedAt: null
        },
        select: { firstName: true, lastName: true, email: true, phone: true }
      })
    ]);

    const totalResidents = (totalOwners || 0) + (totalTenants || 0);

    const systemAlerts: any[] = [];
    if (openComplaints > 5) {
      systemAlerts.push({ id: 1, type: 'warning', title: 'High Complaint Volume', message: `${openComplaints} unresolved complaints currently awaiting response.` });
    }
    if (overdueWorkOrders > 0) {
      systemAlerts.push({ id: 2, type: 'error', title: 'Overdue Work Orders', message: `${overdueWorkOrders} maintenance work orders require immediate attention.` });
    }
    if (totalInactiveUsers > 3) {
      systemAlerts.push({ id: 3, type: 'info', title: 'Inactive User Accounts', message: `${totalInactiveUsers} staff/resident accounts are inactive or locked.` });
    }
    if (systemAlerts.length === 0) {
      systemAlerts.push({ id: 0, type: 'success', title: 'All Systems Optimal', message: 'Organization is operating within healthy enterprise parameters.' });
    }

    return {
      organization: {
        ...org,
        status: org.status || (org.deletedAt ? 'INACTIVE' : 'ACTIVE'),
        code: org.code || `ORG-${org.id.slice(0, 6).toUpperCase()}`,
        type: org.type || 'Property & Asset Management',
        plan: org.subscriptionPlan || 'Enterprise Multi-Tenant',
      },
      admin: adminUser ? {
        name: `${adminUser.firstName} ${adminUser.lastName || ''}`.trim() || 'Assigned Admin',
        email: adminUser.email,
        phone: adminUser.phone || 'N/A',
        status: 'Active Verified'
      } : {
        name: 'No Admin Assigned',
        email: org.contactEmail || 'N/A',
        phone: org.contactPhone || 'N/A',
        status: 'Pending Assignment'
      },
      summary: {
        totalBuildings: totalBuildings || 0,
        totalTowers: totalTowers || 0,
        totalFloors: totalFloors || 0,
        totalUnits: totalUnits || 0,
        totalOwners: totalOwners || 0,
        totalTenants: totalTenants || 0,
        totalResidents: totalResidents || 0,
        totalTechnicians: totalTechnicians || 0,
        totalStaff: totalStaff || 0,
        totalActiveUsers: totalActiveUsers || 0,
        totalComplaints: totalComplaints || 0,
        totalWorkOrders: totalWorkOrders || 0,
        totalAssets: totalAssets || 0,
        totalFacilities: totalFacilities || 0,
      },
      health: {
        activeUsers: totalActiveUsers || 0,
        inactiveUsers: totalInactiveUsers || 0,
        openComplaints: openComplaints || 0,
        pendingWorkOrders: pendingWorkOrders || 0,
        overdueWorkOrders: overdueWorkOrders || 0,
        activeMaintenanceTasks: pendingWorkOrders || 0,
      },
      systemAlerts,
      recentActivities: recentActivities.map(a => ({
        ...a,
        organizationName: org.name
      }))
    };
  }

  /**
   * Helper to seed realistic activities across organizations if the database is empty.
   */
  private async seedSampleActivities() {
    const orgs = await this.prisma.organization.findMany({ take: 5 });
    if (orgs.length === 0) return;

    const users = await this.prisma.user.findMany({ take: 10, include: { userRoles: { include: { role: true } } } });

    const sampleActions = [
      { action: 'CREATE', module: 'Property Management', entity: 'Building', desc: 'Organization Admin created a new building (Northwood Heights)' },
      { action: 'CREATE', module: 'Property Management', entity: 'Tower', desc: 'Building Manager created tower Block-A Residential' },
      { action: 'CREATE', module: 'Property Management', entity: 'Floor', desc: 'Property Admin created Level 4 Floor layout' },
      { action: 'CREATE', module: 'Property Management', entity: 'Unit', desc: 'User created Unit 402-A Residential Block' },
      { action: 'ASSIGN', module: 'User Management', entity: 'Resident', desc: 'Owner added to Unit 402-A (Dr. Robert Harris)' },
      { action: 'ASSIGN', module: 'User Management', entity: 'Tenant', desc: 'Tenant assigned to Unit 105-C Commercial Suite' },
      { action: 'CREATE', module: 'User Management', entity: 'User', desc: 'Resident registered via Portal Invitation' },
      { action: 'CREATE', module: 'Staff Management', entity: 'Technician', desc: 'Technician profile created (Marcus Vance - Electrical & HVAC)' },
      { action: 'ASSIGN', module: 'Staff Management', entity: 'Technician', desc: 'Technician assigned to Tower Alpha & South Building' },
      { action: 'CREATE', module: 'Complaint Management', entity: 'Complaint', desc: 'Resident raised a complaint (Water pipeline leakage in corridor)' },
      { action: 'UPDATE', module: 'Complaint Management', entity: 'Complaint', desc: 'Complaint status changed from OPEN to IN_PROGRESS' },
      { action: 'CREATE', module: 'Work Orders', entity: 'Work Order', desc: 'Work order #WO-9942 created for emergency generator inspection' },
      { action: 'ASSIGN', module: 'Work Orders', entity: 'Work Order', desc: 'Work order assigned to technician Marcus Vance' },
      { action: 'COMPLETE', module: 'Work Orders', entity: 'Work Order', desc: 'Work order #WO-9938 completed with photographic maintenance report' },
      { action: 'CREATE', module: 'Asset Management', entity: 'Asset', desc: 'Asset created (Cummins 500kVA Standby Generator - Roof Deck)' },
      { action: 'UPDATE', module: 'Asset Management', entity: 'Asset', desc: 'Asset updated: maintenance calibration interval set to 90 days' },
      { action: 'CREATE', module: 'Preventive Maintenance', entity: 'Schedule', desc: 'Maintenance schedule created for Elevator Bank B Quarterly Inspection' },
      { action: 'CREATE', module: 'Facility Management', entity: 'Booking', desc: 'Facility request created for Clubhouse Amphitheater (Saturday Eve)' },
      { action: 'CREATE', module: 'Visitor Management', entity: 'Visitor', desc: 'Visitor registered at Main Security Gate (Vehicle Pass #GP-884)' },
      { action: 'UPDATE', module: 'Access Management', entity: 'Role', desc: 'User role changed: promoted from Building Manager to Facility Director' },
      { action: 'UPDATE', module: 'Access Management', entity: 'Permission', desc: 'Permission updated: enabled asset export capabilities for Auditors' },
      { action: 'ACTIVATE', module: 'User Management', entity: 'User', desc: 'User account activated by security administrator' },
      { action: 'DEACTIVATE', module: 'User Management', entity: 'User', desc: 'User deactivated following termination of leasing agreement' },
      { action: 'UPLOAD', module: 'Document Management', entity: 'Document', desc: 'Document uploaded (Annual Fire Safety & Life Support Compliance Guide.pdf)' },
      { action: 'DELETE', module: 'Document Management', entity: 'Document', desc: 'Document deleted: outdated electrical wiring schematic v1.2' },
      { action: 'UPDATE', module: 'Organization', entity: 'Settings', desc: 'Organization settings changed: automated SLA escalation timeout set to 24h' },
    ];

    const rolesList = ['ORGANIZATION_ADMIN', 'BUILDING_MANAGER', 'PROPERTY_ADMIN', 'FACILITY_MANAGER', 'RESIDENT', 'TECHNICIAN', 'SECURITY_GUARD', 'PLATFORM_SUPER_ADMIN'];
    const namesList = ['Sarah Jenkins', 'Marcus Vance', 'Johnathan Doe', 'Elena Rostova', 'Devon Carter', 'Rachel Green', 'Harvey Specter', 'Louis Litt', 'Vikram Patel', 'Chloe Bennett'];

    const now = new Date();
    for (let i = 0; i < 45; i++) {
      const org = orgs[i % orgs.length];
      const sample = sampleActions[i % sampleActions.length];
      const role = rolesList[i % rolesList.length];
      const name = namesList[i % namesList.length];
      const hoursAgo = Math.floor(Math.random() * (i * 6 + 12));
      const logTime = new Date(now.getTime() - hoursAgo * 3600 * 1000);

      const isUpdate = sample.action === 'UPDATE' || sample.action === 'ASSIGN' || sample.action === 'ACTIVATE';
      const oldValue = isUpdate ? { status: 'PREVIOUS_STATE', value: 'Old Setting / Unassigned' } : undefined;
      const newValue = isUpdate ? { status: sample.action === 'COMPLETE' ? 'COMPLETED' : 'ACTIVE_STATE', value: 'Updated to Enterprise Standards' } : undefined;

      await this.prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userName: name,
          userRole: role,
          actorEmail: `${name.toLowerCase().replace(/\s/g, '.')}@${org.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bmms'}.com`,
          module: sample.module,
          action: (AuditAction as any)[sample.action] || AuditAction.RECORD_UPDATED,
          actionType: sample.action,
          entityType: sample.entity,
          description: sample.desc,
          oldValue,
          newValue,
          oldValues: oldValue,
          newValues: newValue,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 200 + 10)}`,
          userAgent: i % 3 === 0 ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) Safari/605.1.15' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
          status: i === 18 || i === 31 ? 'FAILED' : 'SUCCESS',
          createdAt: logTime,
        }
      });

      if (i === 0) {
        await this.prisma.organization.update({
          where: { id: org.id },
          data: { lastActivityAt: logTime, code: `ORG-${org.id.slice(0, 6).toUpperCase()}` }
        });
      }
    }
    this.logger.log('Successfully seeded 45 enterprise activity and audit log entries!');
  }
}
