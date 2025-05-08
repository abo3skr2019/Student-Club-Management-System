import { Request, Response } from 'express';
import { db } from '../db';
import { user, GlobalRole } from '../db/schema/user';
import { eq } from 'drizzle-orm';

interface TokenPayload {
    sub: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    nationalId?: string;
    phoneNumber?: string;
    uniId?: string;
    picture?: string;
}

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
    token?: string;
}

export const getUser = async (req: AuthenticatedRequest, res: Response) => {
    // Guard clause: return unauthorized if req.user is not set.
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sub, email, name, given_name, family_name, nationalId, phoneNumber, uniId, picture } = req.user;

    try {
        // Look up user in database.
        const [existing] = await db.select().from(user).where(eq(user.email, email));
        let dbUser = existing;
        if (!dbUser) {
            const providerInfo = [{ name: 'azure', providerId: sub }];
            const [created] = await db.insert(user).values({
                uniId: uniId,
                displayName: name || (given_name ? `${given_name} ${family_name || ''}` : ''),
                firstName: given_name || '',
                lastName: family_name || '',
                email,
                nationalId, 
                phoneNumber, 
                profileImage: picture || '',
                providers: providerInfo,
                globalRole: GlobalRole.USER,
            }).returning();
            dbUser = created;
        }

        return res.json({ token: req.token, user: dbUser });
    } catch (error) {
        console.error('Get User error', error);
        return res.status(500).json({ error: 'User retrieval failed' });
    }
};