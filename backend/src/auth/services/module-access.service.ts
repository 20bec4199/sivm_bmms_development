import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';



const MODULE_ALIASES: Record<string, string[]> = {
  SMARTI_ALERT: ['SMARTI_ALERT', 'COMMUNITY_MANAGEMENT'],
  COMMUNITY_MANAGEMENT: ['COMMUNITY_MANAGEMENT', 'SMARTI_ALERT'],
  SMARTI_CARE: ['SMARTI_CARE', 'COMPLAINT_MANAGEMENT'],
  COMPLAINT_MANAGEMENT: ['COMPLAINT_MANAGEMENT', 'SMARTI_CARE'],
  SMARTI_FACILITY: ['SMARTI_FACILITY', 'FACILITY_MANAGEMENT'],
  FACILITY_MANAGEMENT: ['FACILITY_MANAGEMENT', 'SMARTI_FACILITY'],
  SMARTI_WORK: ['SMARTI_WORK', 'WORK_ORDERS', 'PREVENTIVE_MAINTENANCE', 'TECHNICIAN'],
  WORK_ORDERS: ['WORK_ORDERS', 'SMARTI_WORK', 'TECHNICIAN'],
  PREVENTIVE_MAINTENANCE: ['PREVENTIVE_MAINTENANCE', 'SMARTI_WORK'],
  TECHNICIAN: ['TECHNICIAN', 'WORK_ORDERS', 'SMARTI_WORK'],
  SMARTI_ASSET: ['SMARTI_ASSET', 'ASSET_MANAGEMENT'],
  ASSET_MANAGEMENT: ['ASSET_MANAGEMENT', 'SMARTI_ASSET'],
  SMARTI_VISIT: ['SMARTI_VISIT', 'VISITOR_MANAGEMENT'],
  VISITOR_MANAGEMENT: ['VISITOR_MANAGEMENT', 'SMARTI_VISIT'],
  SMARTI_PARK: ['SMARTI_PARK', 'PARKING_MANAGEMENT'],
  PARKING_MANAGEMENT: ['PARKING_MANAGEMENT', 'SMARTI_PARK'],
  DOCUMENT: ['DOCUMENT', 'DOCUMENT_MANAGEMENT'],
  DOCUMENT_MANAGEMENT: ['DOCUMENT_MANAGEMENT', 'DOCUMENT'],
};

@Injectable()
export class ModuleAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates if a proposed set of modules satisfies all strict system dependencies.
   */
  async validateDependencies(requestedModules: string[]): Promise<void> {
    if (!requestedModules || requestedModules.length === 0) return;

    const deps = await this.prisma.moduleDependency.findMany({
      where: {
        isActive: true,
        isRequired: true,
        module: { code: { in: requestedModules }, isActive: true },
      },
      include: {
        module: true,
        dependencyModule: true
      }
    });

    for (const dep of deps) {
      if (!requestedModules.includes(dep.dependencyModule.code)) {
        throw new BadRequestException(
          `Dependency Validation Failed: Cannot activate module '${dep.module.code}' because it requires the active module: '${dep.dependencyModule.code}'`
        );
      }
    }
  }

  /**
   * Validates if an organization has active subscriptions for ALL required modules.
   */
  async hasModules(organizationId: string, requiredModules: string[]): Promise<boolean> {
    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const expandedCodes = Array.from(
      new Set(requiredModules.flatMap((mod) => MODULE_ALIASES[mod] || [mod]))
    );

    const organizationModules = await this.prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
        module: {
          code: { in: expandedCodes },
          isActive: true,
        },
      },
      include: {
        module: true,
      },
    });

    const enabledModuleCodes = new Set(organizationModules.map((om) => om.module.code));
    return requiredModules.every((mod) => {
      const allowed = MODULE_ALIASES[mod] || [mod];
      return allowed.some((code) => enabledModuleCodes.has(code));
    });
  }

  /**
   * Retrieves all active module codes for an organization.
   */
  async getActiveModuleCodes(organizationId: string): Promise<string[]> {
    const orgModules = await this.prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
        module: { isActive: true },
      },
      include: { module: true },
    });
    const codes = orgModules.map((om) => om.module.code);
    const allCodes = new Set(codes);
    for (const code of codes) {
      const aliases = MODULE_ALIASES[code] || [];
      aliases.forEach((a) => allCodes.add(a));
    }
    return Array.from(allCodes);
  }

  async updateOrganizationModules(organizationId: string, moduleCodes: string[]): Promise<void> {
    // 1. Enforce Dependency Rules first
    await this.validateDependencies(moduleCodes);

    // Verify organization exists
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Resolve module IDs from codes
    const modules = await this.prisma.moduleMaster.findMany({
      where: { code: { in: moduleCodes }, isActive: true },
    });
    
    const validModuleIds = modules.map((m) => m.id);

    // Use a transaction to replace the modules safely
    await this.prisma.$transaction(async (prisma) => {
      // Deactivate all existing first
      await prisma.organizationModule.updateMany({
        where: { organizationId },
        data: { isActive: false },
      });

      // Upsert the new ones as active
      for (const moduleId of validModuleIds) {
        await prisma.organizationModule.upsert({
          where: {
            organizationId_moduleId: {
              organizationId,
              moduleId,
            },
          },
          update: { isActive: true },
          create: {
            organizationId,
            moduleId,
            isActive: true,
          },
        });
      }
    });
  }
}
