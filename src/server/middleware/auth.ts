import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export interface AuthRequest extends Request {
  user?: any;
  id?: string;
  [key: string]: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-do-not-use-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { business: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Contact support.',
      });
    }

    const updateData: any = { lastLoginAt: new Date(), lastLoginIp: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '' };

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Generate CSRF token for the session
    const { CSRFService } = await import('../services/csrf.service.js');
    const csrfToken = await CSRFService.generateToken(user.id);
    res.setHeader('X-CSRF-Token', csrfToken);

    req.user = {
      id: user.id,
      email: user.email,
      businessId: user.businessId || 'super-admin',
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }
    next(error);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

export const requireBusinessOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Only business owners can perform this action',
    });
  }

  next();
};

export const requireBusinessAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const businessId = req.params.businessId || req.body.businessId;

    if (!businessId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user?.businessId !== businessId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this business',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Plan-based API rate limits (requests per minute)
const PLAN_RATE_LIMITS: Record<string, number> = {
  FREE: 30,
  BASIC: 60,
  PROFESSIONAL: 120,
  ENTERPRISE: 300,
  AGENCY: 9999,
};

// In-memory rate limit tracking per business
const planRateCounters: Map<string, { count: number; resetAt: number }> = new Map();

// Cleanup old counters every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of planRateCounters) {
    if (val.resetAt < now) planRateCounters.delete(key);
  }
}, 5 * 60 * 1000);

// Plan-based rate limiter middleware
export const planRateLimiter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next();

  const businessId = req.user.businessId || 'super-admin';
  const now = Date.now();
  const counter = planRateCounters.get(businessId);

  // Reset counter if window expired
  if (!counter || counter.resetAt < now) {
    planRateCounters.set(businessId, { count: 1, resetAt: now + 60000 });
    return next();
  }

  // Get user's plan (default to FREE)
  let plan = 'FREE';
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { business: { select: { plan: true } } },
    });
    plan = user?.business?.plan || 'FREE';
  } catch {}

  const limit = PLAN_RATE_LIMITS[plan] || 30;

  if (counter.count >= limit) {
    return res.status(429).json({
      success: false,
      error: `API rate limit exceeded for ${plan} plan. Upgrade for higher limits.`,
      limit,
      windowMs: 60000,
    });
  }

  counter.count++;
  planRateCounters.set(businessId, counter);
  next();
};

export const checkPlanLimits = (resource: string, limit: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const business = await prisma.business.findUnique({
        where: { id: req.user.businessId },
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          error: 'Business not found',
        });
      }

      const planLimits: any = {
        FREE: { contacts: 500, messages: 100, posts: 10, posters: 20 },
        STARTER: { contacts: 2000, messages: 1000, posts: 50, posters: 100 },
        GROWTH: { contacts: 10000, messages: 5000, posts: 200, posters: 500 },
        PRO: { contacts: 50000, messages: 20000, posts: 1000, posters: 2000 },
        AGENCY: { contacts: 100000, messages: 100000, posts: 10000, posters: 10000 },
      };

      const currentLimit = planLimits[business.plan]?.[resource] || 0;

      if (currentLimit < limit) {
        return res.status(429).json({
          success: false,
          error: `Plan limit exceeded. Upgrade your plan to send more ${resource}.`,
          currentLimit,
          requested: limit,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
