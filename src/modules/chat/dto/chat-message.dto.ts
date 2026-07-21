import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Upper bound on user message length to limit prompt-stuffing / cost abuse. */
export const CHAT_MESSAGE_MAX_LENGTH = 4000;

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(CHAT_MESSAGE_MAX_LENGTH)
  message!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
