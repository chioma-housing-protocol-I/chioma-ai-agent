import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('security headers', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.CHIOMA_API_URL = 'http://localhost:3000';
    const [{ AppModule }, { applySecurityHeaders }] = await Promise.all([
      import('./app.module'),
      import('./main'),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    applySecurityHeaders(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('adds Helmet security headers to HTTP responses', async () => {
    expect(app).toBeDefined();
    const httpServer = app!.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];
    const response = await request(httpServer).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
  });
});
