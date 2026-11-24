import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ApiMessages } from './api-messages';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * MFC Enterprise Foundation Framework - Rate Limit Request Middleware
 * Membatasi jumlah request per window waktu (default 120 request per menit per IP/Token).
 */
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, RateLimitRecord>();
  private readonly WINDOW_MS = 60 * 1000; // 1 menit
  private readonly MAX_REQUESTS = 120; // 120 request per window

  use(req: Request, res: Response, next: NextFunction): void {
    // Lewatkan OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      return next();
    }

    const clientIdentifier =
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['authorization'] as string) ||
      req.ip ||
      'anonymous-client';

    const now = Date.now();
    let record = this.requests.get(clientIdentifier);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      };
      this.requests.set(clientIdentifier, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, this.MAX_REQUESTS - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (record.count > this.MAX_REQUESTS) {
      res.status(429).json({
        status: 'error',
        statusCode: 429,
        message: ApiMessages.rateLimitExceeded,
        error: 'Too Many Requests',
        retryAfter: resetSeconds,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  }
}
