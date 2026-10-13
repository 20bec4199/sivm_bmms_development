import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface FieldError {
  field: string;
  message: string;
}

export interface EnterpriseErrorResponse {
  success: boolean;
  statusCode: number;
  error: string;
  message: string;
  errors: FieldError[];
  timestamp: string;
  path: string;
}

@Catch()
export class EnterpriseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EnterpriseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'Internal Server Error';
    let message = 'An unexpected error occurred on the server.';
    let errors: FieldError[] = [];

    // 1. Handle NestJS HttpExceptions (including ValidationPipe errors)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      errorName = HttpException.name;
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errorName = exceptionResponse.error || exception.name || errorName;
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0] || 'Validation failed.'
          : exceptionResponse.message || message;

        // Map class-validator array of messages or structured field errors
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message.map((msg: string | any) => {
            if (typeof msg === 'string') {
              // Extract field name from string if possible (e.g. "name must not be empty")
              const parts = msg.split(' ');
              return {
                field: parts[0] || 'unknown',
                message: msg,
              };
            }
            return {
              field: msg.field || msg.property || 'general',
              message: msg.message || JSON.stringify(msg),
            };
          });
        } else if (exceptionResponse.errors && Array.isArray(exceptionResponse.errors)) {
          errors = exceptionResponse.errors;
        }
      }
    } 
    // 2. Handle Prisma Client Database Exceptions
    else if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaErr = exception as any;
      switch (prismaErr.code) {
        case 'P2002': // Unique constraint violation
          statusCode = HttpStatus.CONFLICT; // 409
          errorName = 'Duplicate Resource Conflict';
          const target = prismaErr.meta?.target || 'field';
          const fieldName = Array.isArray(target) ? target.join(', ') : target;
          message = `A record with this ${fieldName} already exists in the system. Duplicate entries are prohibited.`;
          errors = [
            {
              field: String(fieldName),
              message: `Unique constraint violated on ${fieldName}. Please provide a unique value.`,
            },
          ];
          break;

        case 'P2003': // Foreign key constraint violation
          statusCode = HttpStatus.BAD_REQUEST; // 400
          errorName = 'Foreign Key Constraint Violation';
          const field = prismaErr.meta?.field_name || 'relationship';
          message = `Cannot complete operation: invalid reference to related entity (${field}). Ensure the referenced parent record exists.`;
          errors = [
            {
              field: String(field),
              message: `Foreign key constraint failed on ${field}.`,
            },
          ];
          break;

        case 'P2025': // Record not found for update/delete
          statusCode = HttpStatus.NOT_FOUND; // 404
          errorName = 'Resource Not Found';
          message = 'The target record requested for this operation does not exist or was already removed.';
          break;

        case 'P2014': // Relation violation
          statusCode = HttpStatus.UNPROCESSABLE_ENTITY; // 422
          errorName = 'Entity Relation Violation';
          message = 'The change you are trying to make would violate required relational integrity rules.';
          break;

        default:
          statusCode = HttpStatus.BAD_REQUEST;
          errorName = `Database Query Error (${prismaErr.code})`;
          message = prismaErr.message || 'A database operation failed during transaction processing.';
          break;
      }
    }
    // 3. Handle Standard Javascript Errors & Unhandled Fallbacks
    else if (exception instanceof Error) {
      message = exception.message || message;
      errorName = exception.name || errorName;
      this.logger.error(`Unhandled exception in pipeline: ${exception.message}`, exception.stack);
    }

    // Sanitize message for security in production if 500
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = 'An unexpected server error occurred. Please contact system administration.';
      errorName = 'Internal Server Error';
    }

    const responsePayload: EnterpriseErrorResponse = {
      success: false,
      statusCode,
      error: errorName,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log operational errors at warn/error level
    if (statusCode >= 500) {
      this.logger.error(`[${request.method} ${request.url}] ${statusCode} - ${message}`, JSON.stringify(responsePayload));
    } else {
      this.logger.warn(`[${request.method} ${request.url}] ${statusCode} - ${message}`);
    }

    response.status(statusCode).json(responsePayload);
  }
}
