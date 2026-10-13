import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    
    // Automatically log mutating HTTP requests (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    const path: string = request.path || '';

    // Derive readable module name from route path (e.g. /api/v1/work-orders -> Work Orders)
    const segments = path.split('/').filter(Boolean);
    let moduleName = 'General Application';
    if (segments.length >= 2) {
      const seg = segments[segments.length - 1].length > 24 ? segments[segments.length - 2] : segments[segments.length - 1];
      moduleName = seg
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }

    let action = 'CREATE';
    if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
    if (method === 'DELETE') action = 'DELETE';
    if (path.includes('login')) action = 'LOGIN';
    if (path.includes('logout')) action = 'LOGOUT';
    if (path.includes('approve')) action = 'APPROVE';
    if (path.includes('reject')) action = 'REJECT';
    if (path.includes('assign')) action = 'ASSIGN';
    if (path.includes('activate')) action = 'ACTIVATE';
    if (path.includes('suspend') || path.includes('deactivate')) action = 'DEACTIVATE';

    const ipAddress = request.headers['x-forwarded-for'] || request.socket?.remoteAddress || '127.0.0.1';
    const userAgent = request.headers['user-agent'] || 'Web Client';

    const oldValues = method === 'PATCH' || method === 'PUT' ? { body: request.body, note: 'Previous entity snapshot before modification' } : null;

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          // Fire and forget logging
          this.auditService.logActivity({
            organizationId: user?.organizationId || request.body?.organizationId,
            userId: user?.id,
            userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'System User',
            userRole: user?.roles?.[0] || 'USER',
            module: moduleName,
            action: action,
            entityType: moduleName,
            entityId: responseBody?.id || responseBody?.data?.id || request.params?.id || null,
            description: `Performed ${action} operation on ${moduleName}`,
            oldValue: oldValues,
            newValue: responseBody?.data || responseBody || null,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : (ipAddress as string),
            userAgent: userAgent as string,
            status: 'SUCCESS',
          }).catch(() => {});
        },
        error: (err) => {
          this.auditService.logActivity({
            organizationId: user?.organizationId,
            userId: user?.id,
            userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'System User',
            userRole: user?.roles?.[0] || 'USER',
            module: moduleName,
            action: action,
            entityType: moduleName,
            description: `Attempted ${action} on ${moduleName} - Failed: ${err?.message || 'Error'}`,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : (ipAddress as string),
            userAgent: userAgent as string,
            status: 'FAILED',
            metadata: { error: err?.message },
          }).catch(() => {});
        }
      })
    );
  }
}
