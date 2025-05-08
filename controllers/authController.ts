import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { user, GlobalRole } from '../db/schema/user';
import { eq } from 'drizzle-orm';

// New function: getUser that uses token info from the request to retrieve/upsert user record.
export const getUser = async (req: Request, res: Response) => {
	// Token payload expected to have: sub (oid), email, name, given_name, family_name, picture
	const { sub, email, name, given_name, family_name,nationalId,phoneNumber,uniId, picture } = req.user as any;
	try {
		// Look up user in database
		const [existing] = await db.select().from(user).where(eq(user.email, email));
		let dbUser = existing;
		if (!dbUser) {
			const providerInfo = [{ name: 'azure', providerId: sub }];
			const [created] = await db.insert(user).values({
				uniId: uniId,
				displayName: name || given_name+' ' + family_name || '',
				firstName: given_name || '',
				lastName: family_name || '',
				email,
				nationalId: nationalId, // Placeholder
				phoneNumber: phoneNumber, // Placeholder
				profileImage: picture || '',
				providers: providerInfo,
				globalRole: GlobalRole.USER,
			}).returning();
			dbUser = created;
		}
		// Return token (for reference) and user info
		return res.json({ token: req.token, user: dbUser });
	} catch (error) {
		console.error('Get User error', error);
		return res.status(500).json({ error: 'User retrieval failed' });
	}
};

// Retain logout handler if needed
export const logout = (_req: Request, res: Response) => {
	return res.json({ message: 'Logged out' });
};