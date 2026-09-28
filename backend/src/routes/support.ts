import { Router, Request, Response, NextFunction } from 'express';
import { SupportRequest } from '../types';
import { runSupportAgent } from '../services/agentService';
import { getCustomerMemories } from '../services/hindsightService';
import { resetCaseState, getOrCreateCaseState } from '../services/caseService';

const router = Router();

/**
 * GET /api/support/memories/:customerId
 *
 * Retrieves active Hindsight memories stored for the specified customer.
 */
router.get(
  '/memories/:customerId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId } = req.params;
      if (!customerId || customerId.trim() === '') {
        res.status(400).json({ error: 'customerId is required' });
        return;
      }
      const memories = await getCustomerMemories(customerId.trim());
      res.status(200).json({ customerId: customerId.trim(), memories });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/support/reset/:customerId
 *
 * Resets the working case state for a fresh conversation session.
 */
router.post(
  '/reset/:customerId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId } = req.params;
      if (customerId) {
        resetCaseState(customerId.trim());
      }
      res.status(200).json({ status: 'ok', customerId: customerId?.trim() });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/support/message
 *
 * Accepts a customer message and runs the full MemoryDesk pipeline:
 *   recall → LLM → respond → retain
 *
 * Body:
 *   { customerId: string, message: string }
 *
 * Response:
 *   { customerId, response, memorySaved }
 */
router.post(
  '/message',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId, message } = req.body as Partial<SupportRequest>;

      // ── Input validation ──────────────────────────────────────────────────
      if (!customerId || typeof customerId !== 'string' || customerId.trim() === '') {
        res.status(400).json({ error: 'customerId is required and must be a non-empty string.' });
        return;
      }
      if (!message || typeof message !== 'string' || message.trim() === '') {
        res.status(400).json({ error: 'message is required and must be a non-empty string.' });
        return;
      }

      // ── Run the support agent pipeline ────────────────────────────────────
      const result = await runSupportAgent(customerId.trim(), message.trim());

      res.status(200).json(result.response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
