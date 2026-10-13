import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-request.interface';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis | null) {
    if (!this.redis) {
      this.logger.warn('Redis not configured; session cache disabled.');
      return;
    }
    this.redis.on('error', (err) => {
      this.logger.error(`Redis Error: ${err.message}`, err.stack);
    });
    this.redis.on('connect', () => {
      this.logger.log('Successfully connected to Redis.');
    });
  }

  /**
   * Stores the user authorization context in Redis.
   * TTL should match the JWT expiration time (e.g. 15 minutes = 900 seconds).
   */
  async setSessionAuthContext(sid: string, userId: string, authContext: AuthenticatedUser, ttlSeconds: number = 900): Promise<void> {
    if (!this.redis) return;
    try {
      const pipeline = this.redis.pipeline();
      
      // Store the session context
      pipeline.set(`session:${sid}`, JSON.stringify(authContext), 'EX', ttlSeconds);
      
      // Keep a Set of session IDs per user to easily invalidate all sessions for a user
      pipeline.sadd(`user-sessions:${userId}`, sid);
      // The set itself should expire to prevent unbounded growth, 
      // max TTL of a set is the longest possible session TTL. 
      // E.g., setting it to 1 day if that's the absolute max session lifetime.
      pipeline.expire(`user-sessions:${userId}`, 86400); 

      await pipeline.exec();
    } catch (err: any) {
      this.logger.error(`Failed to set Redis session for sid ${sid}: ${err.message}`);
    }
  }

  /**
   * Retrieves the user authorization context from Redis.
   */
  async getSessionAuthContext(sid: string): Promise<AuthenticatedUser | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(`session:${sid}`);
      if (!data) return null;
      return JSON.parse(data) as AuthenticatedUser;
    } catch (err: any) {
      this.logger.error(`Failed to get Redis session for sid ${sid}: ${err.message}`);
      return null;
    }
  }

  /**
   * Invalidates a single session by its session ID.
   */
  async invalidateSession(sid: string, userId?: string): Promise<void> {
    if (!this.redis) return;
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(`session:${sid}`);
      if (userId) {
        pipeline.srem(`user-sessions:${userId}`, sid);
      }
      await pipeline.exec();
    } catch (err: any) {
      this.logger.error(`Failed to invalidate Redis session sid ${sid}: ${err.message}`);
    }
  }

  /**
   * Invalidates all active sessions for a specific user.
   * Useful when user is locked, roles change, permissions change, etc.
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    if (!this.redis) return;
    try {
      const sessions = await this.redis.smembers(`user-sessions:${userId}`);
      if (sessions && sessions.length > 0) {
        const pipeline = this.redis.pipeline();
        sessions.forEach((sid) => {
          pipeline.del(`session:${sid}`);
        });
        pipeline.del(`user-sessions:${userId}`);
        await pipeline.exec();
      }
    } catch (err: any) {
      this.logger.error(`Failed to invalidate all sessions for user ${userId}: ${err.message}`);
    }
  }
}
