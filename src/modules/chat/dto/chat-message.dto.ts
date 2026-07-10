import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const MAX_CHAT_MESSAGE_LENGTH = 4000;

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
  message!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
