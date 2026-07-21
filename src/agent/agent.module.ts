import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { MemoryModule } from './memory/memory.module';
import { ToolsModule } from '../tools/tools.module';
import {
  ConversationService,
  HISTORY_TOKEN_BUDGET,
} from './conversation/conversation.service';
import { RootConfig } from '../config/env.validation';

@Module({
  imports: [LlmModule, MemoryModule, ToolsModule],
  providers: [
    ConversationService,
    {
      provide: HISTORY_TOKEN_BUDGET,
      useFactory: (configService: ConfigService<RootConfig, true>) =>
        configService.get('app', { infer: true }).historyTokenBudget,
      inject: [ConfigService],
    },
  ],
  exports: [ConversationService],
})
export class AgentModule {}
