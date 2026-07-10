import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ChatMessageDto,
  MAX_CHAT_MESSAGE_LENGTH,
} from './chat-message.dto';

describe('ChatMessageDto', () => {
  it('is valid with just a message', async () => {
    const dto = plainToInstance(ChatMessageDto, { message: 'hello' });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('is valid with a message and sessionId', async () => {
    const dto = plainToInstance(ChatMessageDto, {
      message: 'hello',
      sessionId: 'session-1',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an empty message', async () => {
    const dto = plainToInstance(ChatMessageDto, { message: '' });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0].property).toBe('message');
  });

  it('accepts a message at the maximum length', async () => {
    const dto = plainToInstance(ChatMessageDto, {
      message: 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH),
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a message above the maximum length', async () => {
    const dto = plainToInstance(ChatMessageDto, {
      message: 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1),
    });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0].property).toBe('message');
  });

  it('rejects a missing message', async () => {
    const dto = plainToInstance(ChatMessageDto, {});

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'message')).toBe(true);
  });
});
