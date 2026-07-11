import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({
    description: 'User message sent to the conversational agent',
    example: 'Show me 2-bedroom listings under $2000 near downtown',
  })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({
    description: 'Existing session id; a new one is created when omitted',
    example: 'session-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
