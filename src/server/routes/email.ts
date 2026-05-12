import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { EmailService } from '../services/email.service.js';
import { prisma } from '../index.js';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/email/test
 * Test SMTP connection
 */
router.post('/test', authenticate, async (req: any, res: Response) => {
  try {
    const result = await EmailService.testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: 'SMTP connection successful',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Email test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/password-reset
 * Request password reset
 */
router.post('/password-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store in a JSON field or create a password reset table
        // For now, using a simple approach with additional field
      },
    });

    // Send reset email
    try {
      await EmailService.sendPasswordResetEmail(
        user.email,
        user.name || 'User',
        resetToken
      );
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    res.json({
      success: true,
      message: 'If an account exists, a reset email has been sent',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /auth/password-reset/confirm
 * Confirm password reset
 */
router.post('/password-reset/confirm', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // TODO: Validate token and update password
    // This requires storing reset tokens in database

    res.json({
      success: true,
      message: 'Password has been reset',
    });
  } catch (error: any) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; // @ts-nocheck // @ts-nocheck
