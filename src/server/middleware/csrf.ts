import { Request, Response, NextFunction } from 'express';
import { CSRFService } from '../services/csrf.service.js';
import { AuthRequest } from './auth.js';

/**
 * CSRF Token Validation Middleware
 * Validates CSRF token from request headers
 */
export const validateCSRF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // GET requests don't need CSRF protection
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const csrfToken = req.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token required',
      });
    }

    const isValid = await CSRFService.validateToken(req.user.id, csrfToken);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired CSRF token',
      });
    }

    next();
  } catch (error: any) {
    console.error('CSRF validation error:', error);
    res.status(500).json({
      success: false,
      error: 'CSRF validation failed',
    });
  }
};
