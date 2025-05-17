import { Request, Response } from 'express';
import { z } from 'zod';
import { deleteUserById, createUser, findUserByIdWithOptions } from '../services/userService';
import { insertUserSchema } from '../db/schema/user';

// Typed request with user context , Easier to migrate to jwt and msal
interface AuthRequest extends Request {
    user?: { id: number };
    session?: any;
}

/**
 * GET /profile
 * Return user's information
 */
export const getProfile = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // extract requested fields and relations
        const { fields = [], include = [] } = (req as any).parsedQuery || {};
        const user = await findUserByIdWithOptions(userId, { fields, include });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * DELETE /profile
 * Delete the logged-in user's account
 */
export const deleteAccount = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
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
    } catch (error) {
        console.error('Error in deleteAccount:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * POST /profile
 * Create a new user account
 */
export const createProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        // Validate input
        const parsed = insertUserSchema.safeParse(req.body);
        if (!parsed.success) {
            // Validated variables
            res.status(400).json({ errors: parsed.error.format() });
            return;
        }
        // Create user
        const user = await createUser(parsed.data);
        res.status(201).json({ user });
    } catch (error) {
        console.error('Error in createProfile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
