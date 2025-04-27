import { microsoftLogin, microsoftCallback, loginFailure, logout } from '../../controllers/authController';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { createRequest, createResponse } from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import { db } from '../../db';

describe('AuthController Unit Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loginFailure returns 401 JSON', () => {
    const req = createRequest();
    const res = createResponse();
    loginFailure(req as any, res as any);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Login failed' });
  });

  it('logout returns logged‑out message', () => {
    const req = createRequest();
    const res = createResponse();
    logout(req as any, res as any);
    expect(res._getJSONData()).toEqual({ message: 'Logged out' });
  });

  it('microsoftLogin redirects to MSAL URL', async () => {
    const fakeUrl = 'https://login.microsoftonline.com/...';
    jest.spyOn(ConfidentialClientApplication.prototype, 'getAuthCodeUrl').mockResolvedValue(fakeUrl);
    const req = createRequest();
    const res = createResponse();
    await microsoftLogin(req as any, res as any);
    expect(res._getRedirectUrl()).toBe(fakeUrl);
  });

  it('microsoftCallback issues JWT for existing user', async () => {
    const fakeTokenResp = {
      account: { username: 'u12345678@university.edu.sa', homeAccountId: 'abc-123' },
      idTokenClaims: {},
    };
    jest.spyOn(ConfidentialClientApplication.prototype, 'acquireTokenByCode').mockResolvedValue(fakeTokenResp as any);
    const userObj = { id: 5, email: 'u12345678@university.edu.sa', globalRole: 'user' } as any;
    // mock db.select().from().where()
    jest.spyOn(db, 'select').mockReturnValue({ from: () => ({ where: () => Promise.resolve([userObj]) }) } as any);
    jest.spyOn(jwt, 'sign').mockImplementation(() => 'signedJwt');

    const req = createRequest({ query: { code: 'code123' } });
    const res = createResponse();
    await microsoftCallback(req as any, res as any);

    expect(res._getJSONData()).toEqual({ token: 'signedJwt', user: userObj });
  });

  it('microsoftCallback auto-registers new user when not found', async () => {
    const fakeTokenResp = {
      account: { username: 'n76543210@university.edu.sa', homeAccountId: 'def-456' },
      idTokenClaims: { name: 'New User', given_name: 'New', family_name: 'User', picture: 'http://pic' },
    };
    jest.spyOn(ConfidentialClientApplication.prototype, 'acquireTokenByCode').mockResolvedValue(fakeTokenResp as any);
    // mock empty select
    jest.spyOn(db, 'select').mockReturnValue({ from: () => ({ where: () => Promise.resolve([]) }) } as any);
    const newDbUser = { id: 7, email: 'n76543210@university.edu.sa', globalRole: 'user', uniId: 'n76543210' } as any;
    // mock insert().values().returning()
    jest.spyOn(db, 'insert').mockReturnValue({ values: () => ({ returning: () => Promise.resolve([newDbUser]) }) } as any);
    jest.spyOn(jwt, 'sign').mockImplementation(() => 'newJwt');

    const req = createRequest({ query: { code: 'code456' } });
    const res = createResponse();
    await microsoftCallback(req as any, res as any);

    expect(res._getJSONData()).toEqual({ token: 'newJwt', user: newDbUser });
  });
});