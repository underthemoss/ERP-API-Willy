import { createTestEnvironment } from './test-environment';

const { createClient, createAnonTestClient } = createTestEnvironment();

describe('Auth cookie exchange', () => {
  it('sets a cookie via /api/auth/set-cookie and authenticates via /api/auth/me', async () => {
    const authed = await createClient();

    const setCookieResponse = await authed.httpClient.fetch(
      '/api/auth/set-cookie',
      {
        method: 'POST',
        body: '{}',
      },
    );

    expect(setCookieResponse.status).toBe(204);

    const setCookies: string[] | undefined = (setCookieResponse.headers as any)
      ?.getSetCookie?.();
    const setCookieHeader =
      (Array.isArray(setCookies) && setCookies[0]) ||
      setCookieResponse.headers.get('set-cookie');

    expect(setCookieHeader).toEqual(expect.stringContaining('es-erp-jwt='));

    const cookie = setCookieHeader?.split(';')?.[0];
    expect(cookie).toEqual(expect.stringContaining('es-erp-jwt='));

    const { httpClient } = createAnonTestClient();
    const meResponse = await httpClient.fetch('/api/auth/me', {
      headers: {
        Cookie: cookie!,
      },
    });

    expect(meResponse.status).toBe(200);
    await expect(meResponse.json()).resolves.toMatchObject({
      user: {
        id: authed.user.id,
        companyId: authed.user.companyId,
        email: authed.user.email,
      },
    });
  });
});
