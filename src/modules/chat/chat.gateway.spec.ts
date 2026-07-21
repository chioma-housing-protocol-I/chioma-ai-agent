import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AddressInfo } from 'net';
import WebSocket, { RawData } from 'ws';
import { ChatGateway } from './chat.gateway';
import { ConversationService } from '../../agent/conversation/conversation.service';

describe('ChatGateway (e2e)', () => {
  let app: INestApplication;
  let ws: WebSocket | null = null;
  let wsPort: number;
  const mockConversationService = {
    handleTurn: jest.fn().mockResolvedValue('Mock reply'),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ConversationService, useValue: mockConversationService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.listen(0);
    const address = (app.getHttpServer() as any).address() as AddressInfo;
    wsPort = address.port;
  });

  afterAll(async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    await app.close();
  });

  it('should connect and receive a reply event for a chat message', (done) => {
    const wsUrl = `ws://localhost:${wsPort}/chat`;
    ws = new WebSocket(wsUrl, {
      headers: {
        authorization: 'Bearer faketoken',
      },
    });

    ws.on('open', () => {
      ws?.send(JSON.stringify({ event: 'message', data: { message: 'Hello', sessionId: 'test-session' } }));
    });

    ws.on('message', (message: RawData) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.event === 'reply') {
          expect(payload.data.sessionId).toBe('test-session');
          expect(typeof payload.data.reply).toBe('string');
          done();
        }
      } catch (err) {
        done(err as Error);
      }
    });

    ws.on('error', (err: Error) => done(err));
  }, 10000);
});
