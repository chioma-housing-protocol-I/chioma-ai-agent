import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConversationService } from '../../agent/conversation/conversation.service';
import { ToolContext } from '../../tools/tool.interface';

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
  private readonly clientAuthHeaders = new WeakMap<any, string>();

  constructor(private readonly conversationService: ConversationService) {}

  handleConnection(client: any, ...args: any[]): void {
    this.logger.log(`WebSocket client connected: ${client.id}`);
    const request = args[0] as { headers?: Record<string, string> } | undefined;
    const authorization = request?.headers?.authorization || request?.headers?.Authorization;
    if (authorization) {
      this.clientAuthHeaders.set(client, authorization);
    }
  }

  handleDisconnect(client: any): void {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
    this.clientAuthHeaders.delete(client);
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() payload: ChatRequest,
    @ConnectedSocket() client: any,
  ): Promise<WsResponse<ChatResponse>> {
    const authorization = this.clientAuthHeaders.get(client) ||
      client?.handshake?.headers?.authorization ||
      client?.upgradeReq?.headers?.authorization ||
      client?._req?.headers?.authorization ||
      client?.headers?.authorization;
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
