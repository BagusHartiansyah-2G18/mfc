import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';

export interface StandardApiResponse<T = unknown> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

/**
 * MFC Enterprise Foundation Framework - Global REST API Response Envelope Interceptor
 * Menyeragamkan seluruh respons REST API dengan format standar MFC.
 */
@Injectable()
export class MfcResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['X-Request-ID'] as string) ||
      `req-${Date.now().toString(36)}`;

    return next.handle().pipe(
      map((result) => {
        // Jika data respons sudah berformat standar atau file download stream, kembalikan langsung
        if (
          result &&
          typeof result === 'object' &&
          ('status' in result || 'isStandardEnvelope' in result)
        ) {
          return result;
        }

        const statusCode = res.statusCode || HttpStatus.OK;
        const envelope: StandardApiResponse = {
          status: 'success',
          statusCode,
          message: 'Operation completed successfully',
          data: result,
          requestId,
          timestamp: new Date().toISOString(),
        };

        return envelope;
      }),
      catchError((err) => {
        const statusCode =
          err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const errorResponse =
          err instanceof HttpException ? err.getResponse() : null;

        const message =
          typeof errorResponse === 'string'
            ? errorResponse
            : (errorResponse as any)?.message ||
              err.message ||
              'Internal server error';

        const envelope: StandardApiResponse = {
          status: 'error',
          statusCode,
          message: Array.isArray(message) ? message.join(', ') : message,
          requestId,
          timestamp: new Date().toISOString(),
        };

        return throwError(() => new HttpException(envelope, statusCode));
      })
    );
  }
}
