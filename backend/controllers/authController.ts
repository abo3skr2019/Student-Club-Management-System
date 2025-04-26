import { Request, Response } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { user, GlobalRole } from '../db/schema/user';
import { eq } from 'drizzle-orm';
// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
  },
};
const cca = new ConfidentialClientApplication(msalConfig);
const redirectUri = process.env.AZURE_REDIRECT_URI!;
const scopes = ['User.Read'];

// Initiate Microsoft login by redirecting to auth URL
export const microsoftLogin = async (_req: Request, res: Response) => {
  try {
    const authUrl = await cca.getAuthCodeUrl({
      scopes,
      redirectUri,
    });
    return res.redirect(authUrl);
  } catch (err) {
    console.error('MSAL login error', err);
    return res.status(500).json({ error: 'Authentication initiation failed' });
  }
};

// Handle callback, exchange code for token, verify user in DB, return JWT
export const microsoftCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: 'No auth code provided' });
  }

  try {
    const tokenResponse = await cca.acquireTokenByCode({
      code,
      scopes,
      redirectUri,
    });
    const account = tokenResponse?.account;
    if (!account || !account.username) {
      return res.status(401).json({ error: 'Invalid account information' });
    }
    const email = account.username;

    // Look up user in database
    const [existing] = await db.select().from(user).where(eq(user.email, email));
    let dbUser = existing;
    if (!dbUser) {
      // Auto-register new user
      const claims = tokenResponse?.idTokenClaims as any;
      const displayName = claims.name || email;
      const firstName = claims.given_name || '';
      const lastName = claims.family_name || '';
      const profileImage = (claims.picture as string) || '';
      const providerInfo = [{ name: 'microsoft', providerId: account.homeAccountId }];
      // Derive university ID from email prefix
      const uniId = email.split('@')[0];
      const [created] = await db.insert(user).values({
        uniId,
        displayName,
        firstName,
        lastName,
        email,
        nationalId: '', // Placeholder, should be collected from user
        phoneNumber: '', // Placeholder, should be collected from user
        profileImage,
        providers: providerInfo,
        globalRole: GlobalRole.USER,
      }).returning();
      dbUser = created;
    }

    // Issue JWT
    const payload = { userId: dbUser.id, email, role: dbUser.globalRole };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Return token and user info
    return res.json({ token, user: dbUser });
  } catch (err) {
    console.error('MSAL callback error', err);
    return res.redirect('/auth/login-failure');
  }
};

// Login failure handler
export const loginFailure = (_req: Request, res: Response) => {
  return res.status(401).json({ error: 'Login failed' });
};

// Logout handler (client should delete token)
export const logout = (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out' });
};