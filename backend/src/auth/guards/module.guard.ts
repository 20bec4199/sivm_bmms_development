import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULES_KEY } from '../decorators/require-module.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';
import { ModuleAccessService } from '../services/module-access.service';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private reflector: Reflector, private moduleAccessService: ModuleAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModules = this.reflector.getAllAndOverride<string[]>(
      MODULES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModules || requiredModules.length === 0) {
      return true; // No modules required, let it pass
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user || !user.organizationId) {
      return false; // Not authenticated or no org context
    }

    // Platform Super Admin bypass (optional, if you want super admins to always have access to all APIs)
    if (user.isPlatformAdmin) {
      return true;
    }

    // Use the dedicated ModuleAccessService to verify the module subscription dynamically
    const hasAllRequiredModules = await this.moduleAccessService.hasModules(user.organizationId, requiredModules);

    if (!hasAllRequiredModules) {
      throw new ForbiddenException(
        `Your organization does not have an active subscription for the required modules: ${requiredModules.join(', ')}`
      );
    }

    return true;
  }
}
