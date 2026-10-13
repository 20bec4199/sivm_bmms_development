import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();

    if (!user) {
      return false;
    }

    const userRoleNames = (user.roles || []).map((r: any) =>
      typeof r === 'string' ? r.toUpperCase() : (r?.name || '').toUpperCase()
    );

    // Platform Super Admin, Organization Admin, and Building Manager bypass
    if (
      user.isPlatformAdmin ||
      userRoleNames.includes('ORGANIZATION_ADMIN') ||
      userRoleNames.includes('ORG_ADMIN') ||
      userRoleNames.includes('ADMIN') ||
      userRoleNames.includes('BUILDING_MANAGER')
    ) {
      return true;
    }

    // Implicit permissions for Technician role
    if (userRoleNames.includes('TECHNICIAN')) {
      const isWorkOrderAction = requiredPermissions.every(
        rp => rp.subject === 'WorkOrder' && (rp.action === 'UPDATE' || rp.action === 'READ' || rp.action === 'CREATE')
      );
      if (isWorkOrderAction) {
        return true;
      }
    }

    // Implicit permissions for Resident, Unit Owner, and Tenant roles
    if (
      userRoleNames.includes('RESIDENT') ||
      userRoleNames.includes('UNIT_OWNER') ||
      userRoleNames.includes('TENANT') ||
      userRoleNames.includes('OWNER')
    ) {
      const allowedResidentPermissions: { action: string; subject: string }[] = [
        { action: 'CREATE', subject: 'Visitor' },
        { action: 'READ', subject: 'Visitor' },
        { action: 'CREATE', subject: 'VisitorRegistration' },
        { action: 'READ', subject: 'VisitorRegistration' },
        { action: 'READ', subject: 'Property' },
        { action: 'READ', subject: 'Unit' },
        { action: 'CREATE', subject: 'Complaint' },
        { action: 'READ', subject: 'Complaint' },
        { action: 'READ', subject: 'Facility' },
        { action: 'CREATE', subject: 'FacilityBooking' },
        { action: 'READ', subject: 'FacilityBooking' },
        { action: 'CREATE', subject: 'GatePass' },
        { action: 'READ', subject: 'GatePass' },
        { action: 'READ', subject: 'ParkingSlot' },
        { action: 'READ', subject: 'ParkingArea' },
        { action: 'READ', subject: 'ParkingAllocation' },
        { action: 'READ', subject: 'ParkingReservation' },
        { action: 'CREATE', subject: 'ParkingReservation' },
        { action: 'READ', subject: 'ParkingPermit' },
        { action: 'CREATE', subject: 'ParkingPermit' },
        { action: 'READ', subject: 'ParkingSession' },
        { action: 'READ', subject: 'Vehicle' },
        { action: 'CREATE', subject: 'Vehicle' },
        { action: 'UPDATE', subject: 'Vehicle' },
        { action: 'DELETE', subject: 'Vehicle' },
      ];

      const isAllowedResidentAction = requiredPermissions.every(requiredPerm =>
        allowedResidentPermissions.some(
          alp => alp.action === requiredPerm.action && alp.subject === requiredPerm.subject
        )
      );

      if (isAllowedResidentAction) {
        return true;
      }
    }

    const userPermissions = user.permissions || [];

    const hasAllRequiredPermissions = requiredPermissions.every(requiredPerm => {
      // Check for exact match, wildcard subject matching, or module sub-subjects (e.g. Parking covers ParkingArea, ParkingSlot, etc.)
      return userPermissions.some(
        userPerm =>
          (userPerm.action === requiredPerm.action || userPerm.action === 'MANAGE') &&
          (
            userPerm.subject === requiredPerm.subject ||
            userPerm.subject === 'ALL' ||
            (userPerm.subject === 'Parking' && requiredPerm.subject.startsWith('Parking'))
          )
      );
    });

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException('You do not have the required permissions to perform this action.');
    }

    return true;
  }
}
