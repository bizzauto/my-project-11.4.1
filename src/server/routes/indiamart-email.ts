// @ts-nocheck
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { IndiaMARTEmailService } from '../services/indiamart-email.service.js';
import { encrypt, decrypt } from '../utils/auth.js';

const router = Router();

/**
 * POST /api/indiamart/setup
 * Configure IndiaMART email settings for a business
 */
router.post('/setup', authenticate, async (req: any, res: Response) => {
  try {
    const businessId = req.user.businessId;
    const {
      imapHost,
      imapPort,
      email,
      password,
      useSSL = true,
      spreadsheetId,
      autoSync = false,
      syncInterval = 60, // minutes
    } = req.body;

    if (!imapHost || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'IMAP host, email, and password are required',
      });
    }

    // Save email config (encrypted)
    const emailConfig = {
      imapHost,
      imapPort: imapPort || 993,
      email,
      password: encrypt(password),
      useSSL,
      spreadsheetId,
      autoSync,
      syncInterval,
      lastSyncAt: null,
    };

    // Remove old integration first, then create new one
    await prisma.integration.deleteMany({
      where: { businessId, type: 'indiamart_email' },
    });

    const integration = await prisma.integration.create({
      data: {
        businessId,
        type: 'indiamart_email',
        name: 'IndiaMART Email Integration',
        config: emailConfig as any,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'IndiaMART email integration configured',
      data: {
        id: integration.id,
        email,
        imapHost,
        imapPort: imapPort || 993,
        autoSync,
        syncInterval,
      },
    });
  } catch (error: any) {
    console.error('IndiaMART setup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/indiamart/config
 * Get current IndiaMART email configuration (without password)
 */
router.get('/config', authenticate, async (req: any, res: Response) => {
  try {
    const businessId = req.user.businessId;

    const integration = await prisma.integration.findFirst({
      where: { businessId, type: 'indiamart_email' },
    });

    if (!integration) {
      return res.json({
        success: true,
        data: {
          configured: false,
          email: null,
          imapHost: null,
          autoSync: false,
        },
      });
    }

    const config = integration.config as any;

    res.json({
      success: true,
      data: {
        configured: true,
        email: config.email,
        imapHost: config.imapHost,
        imapPort: config.imapPort,
        useSSL: config.useSSL,
        spreadsheetId: config.spreadsheetId,
        autoSync: config.autoSync || false,
        syncInterval: config.syncInterval || 60,
        lastSyncAt: config.lastSyncAt,
        isActive: integration.isActive,
      },
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/indiamart/sync
 * Manually sync IndiaMART emails to leads
 */
router.post('/sync', authenticate, async (req: any, res: Response) => {
  try {
    const businessId = req.user.businessId;
    const { since } = req.body; // Optional: specific date to start from

    // Get email config
    const integration = await prisma.integration.findFirst({
      where: { businessId, type: 'indiamart_email', isActive: true },
    });

    if (!integration) {
      return res.status(400).json({
        success: false,
        error: 'IndiaMART email not configured. Please setup first.',
      });
    }

    const config = integration.config as any;
    const emailConfig = {
      imapHost: config.imapHost,
      imapPort: config.imapPort,
      email: config.email,
      password: decrypt(config.password),
      useSSL: config.useSSL,
    };

    const result = await IndiaMARTEmailService.processIndiaMARTEmails(
      businessId,
      emailConfig,
      {
        since: since ? new Date(since) : undefined,
        saveToSheet: !!config.spreadsheetId,
        spreadsheetId: config.spreadsheetId,
      }
    );

    // Update last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        config: {
          ...config,
          lastSyncAt: new Date().toISOString(),
        } as any,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        businessId,
        type: 'indiamart_sync',
        title: 'IndiaMART Email Sync',
        content: `Processed ${result.processed} emails, captured ${result.newLeads} new leads`,
        metadata: result,
      },
    });

    res.json({
      success: true,
      message: `Synced ${result.newLeads} new leads from ${result.processed} emails`,
      data: result,
    });
  } catch (error: any) {
    console.error('IndiaMART sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check email credentials and IMAP settings',
    });
  }
});

/**
 * GET /api/indiamart/leads
 * Get leads captured from IndiaMART emails
 */
router.get('/leads', authenticate, async (req: any, res: Response) => {
  try {
    const businessId = req.user.businessId;
    const { page = 1, limit = 20, since } = req.query;

    const where: any = {
      businessId,
      source: 'indiamart',
    };

    if (since) {
      where.createdAt = { gte: new Date(since as string) };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [leads, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          company: true,
          source: true,
          tags: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Get IndiaMART leads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/indiamart/disconnect
 * Remove IndiaMART email integration
 */
router.delete('/disconnect', authenticate, async (req: any, res: Response) => {
  try {
    const businessId = req.user.businessId;

    await prisma.integration.deleteMany({
      where: { businessId, type: 'indiamart_email' },
    });

    res.json({
      success: true,
      message: 'IndiaMART email integration removed',
    });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/indiamart/connect
 * Test email connection
 */
router.post('/connect', authenticate, async (req: any, res: Response) => {
  try {
    const { imapHost, imapPort, email, password, useSSL = true } = req.body;

    if (!imapHost || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'IMAP host, email, and password are required',
      });
    }

    // Test connection
    const Imap = (await import('imap')).default;
    const imap = new Imap({
      user: email,
      password: password,
      host: imapHost,
      port: imapPort || 993,
      tls: useSSL,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
    });

    return new Promise<void>((resolve) => {
      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          imap.end();
          if (err) {
            res.json({
              success: false,
              error: `Connection failed: ${err.message}`,
            });
          } else {
            res.json({
              success: true,
              message: 'Connection successful!',
              folders: Object.keys(boxes || {}),
            });
          }
          resolve();
        });
      });

      imap.once('error', (err) => {
        res.json({
          success: false,
          error: `Connection failed: ${err.message}`,
        });
        resolve();
      });

      imap.connect();
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Connection test failed: ${error.message}`,
    });
  }
});

export default router; // @ts-nocheck
