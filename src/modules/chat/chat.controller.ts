import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConversationService } from '../../agent/conversation/conversation.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to the conversational agent' })
  async sendMessage(
    @Body() dto: ChatMessageDto,
    @Headers('authorization') authorization?: string,
  ): Promise<{ sessionId: string; reply: string }> {
    const accessToken = this.extractBearerToken(authorization);
    const sessionId = dto.sessionId ?? ConversationService.newSessionId();

    const reply = await this.conversationService.handleTurn(sessionId, dto.message, {
      accessToken,
    });

    return { sessionId, reply };
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset (clear) a chat session' })
  @ApiNoContentResponse({ description: 'Session cleared' })
  async resetSession(@Param('sessionId') sessionId: string): Promise<void> {
    await this.conversationService.resetSession(sessionId);
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing bearer token — pass the chioma backend access token in the Authorization header.',
      );
    }
    return authorization.slice('Bearer '.length);
  }
}
