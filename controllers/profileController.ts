import { Request, Response } from 'express';
import { z } from 'zod';
import {
  findUserById,
  deleteUserById,
} from '../services/userService';

// Typed request with user context
interface AuthRequest extends Request {
  user?: { id: number };
  session?: any;
}

/**
 * GET /profile
 * Return the logged-in user's profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
    return;
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ error: 'Server error' });
    return;
  }
};

/**
 * DELETE /profile
 * Delete the logged-in user's account
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await deleteUserById(userId);

    // Destroy session if exists
    if (req.session) {
      req.session.destroy((err?: Error) => {
        if (err) console.error('Session destruction error:', err);
      });
    }

    res.status(200).json({ success: true });
    return;
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    res.status(500).json({ error: 'Server error' });
    return;
  }
};
