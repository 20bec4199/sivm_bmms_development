import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, any>;
}

@Injectable()
export class EnterpriseTransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the response already matches the standard wrapper structure
        if (res && typeof res === 'object') {
          if ('success' in res && 'data' in res) {
            return {
              success: res.success ?? true,
              message: res.message || 'Operation completed successfully',
              data: res.data ?? {},
              meta: res.meta ?? {},
            };
          }

          // If controller returned an object with structured message, data, or meta
          if ('data' in res && ('meta' in res || 'message' in res)) {
            const { message, data, meta, ...rest } = res as any;
            return {
              success: true,
              message: message || 'Operation completed successfully',
              data: data !== undefined ? data : rest,
              meta: meta || {},
            };
          }
        }

        // Default standard wrapper for raw data payloads
        return {
          success: true,
          message: 'Operation completed successfully',
          data: res ?? {},
          meta: {},
        };
      }),
    );
  }
}
