import request from 'supertest';
// @ts-ignore: Could not find a declaration file for module '../../../app'.
import app from '../../../app';
import { ConfidentialClientApplication } from '@azure/msal-node';

describe('Auth Routes Integration Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('GET /auth/login-failure should return 401 JSON', async () => {
    const res = await request(app).get('/auth/login-failure');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Login failed' });
  });

  it('GET /auth/logout should return 200 JSON', async () => {
    const res = await request(app).get('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Logged out' });
  });

  it('GET /auth/microsoft should redirect to Microsoft login URL', async () => {
    const fakeUrl = 'https://login.microsoftonline.com/fake';
    jest.spyOn(ConfidentialClientApplication.prototype, 'getAuthCodeUrl').mockResolvedValue(fakeUrl);

    const res = await request(app).get('/auth/microsoft');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(fakeUrl);
  });
});