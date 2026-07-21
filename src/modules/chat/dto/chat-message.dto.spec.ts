import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CHAT_MESSAGE_MAX_LENGTH, ChatMessageDto } from './chat-message.dto';

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

  it('rejects a missing message', async () => {
    const dto = plainToInstance(ChatMessageDto, {});

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'message')).toBe(true);
  });

  it('rejects a message that exceeds the max length', async () => {
    const dto = plainToInstance(ChatMessageDto, {
      message: 'x'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1),
    });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0].property).toBe('message');
  });
});
