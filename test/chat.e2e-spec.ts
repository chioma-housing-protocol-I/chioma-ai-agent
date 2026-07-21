// Dummy config so ConfigModule's validateEnvironment() passes at boot without
// requiring real secrets. Set before AppModule (and its ConfigModule) loads.
process.env.CHIOMA_API_URL ??= 'http://localhost:3000';
process.env.LLM_PROVIDER ??= 'anthropic';
process.env.ANTHROPIC_API_KEY ??= 'test-anthropic-key';
process.env.SESSION_STORE ??= 'memory';

import { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  LLM_PROVIDER,
  LlmProvider,
} from '../src/agent/llm/llm-provider.interface';
import {
  SESSION_STORE,
  SessionStore,
} from '../src/agent/memory/session-store.interface';

interface ChatResponse {
  sessionId: string;
  reply: string;
}

// Canned, non-tool-call response so ConversationService finishes a turn without
// any real OpenAI/Anthropic network call.
const fakeLlmProvider: LlmProvider = {
  complete: () =>
    Promise.resolve({
      stopReason: 'stop',
      message: { role: 'assistant', content: 'Stubbed assistant reply.' },
    }),
};

describe('DELETE /chat/:sessionId (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let sessionStore: SessionStore;
  const authHeader = 'Bearer test-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LLM_PROVIDER)
      .useValue(fakeLlmProvider)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer() as Server;
    sessionStore = app.get<SessionStore>(SESSION_STORE);
  });

  afterAll(async () => {
    await app.close();
  });

  it("clears a session's history after DELETE", async () => {
    // (a) First turn creates a session.
    const created = await request(httpServer)
      .post('/chat')
      .set('Authorization', authHeader)
      .send({ message: 'Hello there' })
      .expect(201);

    const { sessionId } = created.body as ChatResponse;
    expect(sessionId).toBeTruthy();

    // (b) Second turn with the same sessionId builds up history.
    await request(httpServer)
      .post('/chat')
      .set('Authorization', authHeader)
      .send({ message: 'A follow-up question', sessionId })
      .expect(201);

    // Sanity check: the store actually holds history for this session now.
    const historyBefore = await sessionStore.getHistory(sessionId);
    expect(historyBefore.length).toBeGreaterThan(0);

    // (c) Reset the session.
    await request(httpServer).delete(`/chat/${sessionId}`).expect(204);

    // (d) History is actually gone — assert directly against the store, which is
    // more precise than inferring memory loss from LLM output.
    const historyAfter = await sessionStore.getHistory(sessionId);
    expect(historyAfter).toEqual([]);
  });

  // TODO(#5): DELETE /chat/:sessionId currently has NO auth check (open issue #5).
  // The endpoint accepts any request and returns 204. Once #5 adds the same
  // Bearer-token requirement that POST /chat already enforces, unskip this block.
  describe.skip('auth check (pending #5)', () => {
    it('rejects a delete with no bearer token (401)', async () => {
      await request(httpServer).delete('/chat/some-session-id').expect(401);
    });
  });
});
