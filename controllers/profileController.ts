import { Request, Response } from 'express';
import { z } from 'zod';
import {
  findUserById,
  updateUserById,
  deleteUserById,
} from '../services/userService';
import { updateUserSchema } from '../db/schema/user';

// Typed request with user context
interface AuthRequest extends Request {
  user?: { id: number };
  session?: any;
}

/**
 * GET /profile
 * Return the logged-in user's profile
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /profile
 * Update the logged-in user's profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { firstName, lastName } = parsed.data;
    await updateUserById(userId, { firstName, lastName });

    const updated = await findUserById(userId);
    return res.status(200).json({ user: updated });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * DELETE /profile
 * Delete the logged-in user's account
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await deleteUserById(userId);

    // Destroy session if exists
    if (req.session) {
      req.session.destroy((err?: Error) => {
        if (err) console.error('Session destruction error:', err);
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
