import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { IncomingMessage } from 'http';
import type WebSocket from 'ws';
import { ConversationService } from '../../agent/conversation/conversation.service';

interface ChatRequest {
  message: string;
  sessionId?: string;
}

interface ChatResponse {
  sessionId: string;
  reply: string;
}

@WebSocketGateway({ path: '/chat', cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly clientAuthHeaders = new WeakMap<WebSocket, string>();

  constructor(private readonly conversationService: ConversationService) {}

  handleConnection(client: WebSocket, request?: IncomingMessage): void {
    this.logger.log('WebSocket client connected');
    const authorization = request?.headers?.authorization;
    if (authorization) {
      this.clientAuthHeaders.set(client, authorization);
    }
  }

  handleDisconnect(client: WebSocket): void {
    this.logger.log('WebSocket client disconnected');
    this.clientAuthHeaders.delete(client);
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() payload: ChatRequest,
    @ConnectedSocket() client: WebSocket,
  ): Promise<WsResponse<ChatResponse>> {
    const authorization = this.clientAuthHeaders.get(client);
    const accessToken = this.extractBearerToken(authorization);
    const sessionId = payload.sessionId ?? ConversationService.newSessionId();
    const reply = await this.conversationService.handleTurn(sessionId, payload.message, {
      accessToken,
    });

    return {
      event: 'reply',
      data: { sessionId, reply },
    };
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new Error('Missing bearer token — pass the chioma backend access token in the Authorization header.');
    }
    return authorization.slice('Bearer '.length);
  }
}
