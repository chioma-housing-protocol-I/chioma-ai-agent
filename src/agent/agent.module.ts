import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { MemoryModule } from './memory/memory.module';
import { ToolsModule } from '../tools/tools.module';
import {
  ConversationService,
  HISTORY_TOKEN_BUDGET,
  MAX_TOOL_ITERATIONS,
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
    {
      provide: MAX_TOOL_ITERATIONS,
      useFactory: (configService: ConfigService<RootConfig, true>) =>
        configService.get('app', { infer: true }).maxToolIterations,
      inject: [ConfigService],
    },
  ],
  exports: [ConversationService],
})
export class AgentModule {}
