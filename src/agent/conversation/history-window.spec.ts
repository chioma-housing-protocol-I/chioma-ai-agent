import { applyHistoryWindow, estimateTokens } from './history-window';
import { LlmMessage } from '../llm/llm.types';

/**
 * Builds one complete "turn": a user message, an assistant reply, and
 * optionally a tool round-trip in between. Mirrors exactly what
 * ConversationService.handleTurn appends to session history.
 */
function makeTurn(
  index: number,
  options: { withToolCall?: boolean; contentLength?: number } = {},
): LlmMessage[] {
  const filler = 'x'.repeat(options.contentLength ?? 20);
  const turn: LlmMessage[] = [
    { role: 'user', content: `question ${index} ${filler}` },
  ];

  if (options.withToolCall) {
    turn.push({
      role: 'assistant',
      content: '',
      toolCalls: [
        { id: `call-${index}`, name: 'lookup', arguments: { id: index } },
      ],
    });
    turn.push({
      role: 'tool',
      content: `tool result ${index} ${filler}`,
      toolCallId: `call-${index}`,
      name: 'lookup',
    });
  }

  turn.push({ role: 'assistant', content: `answer ${index} ${filler}` });
  return turn;
}

describe('estimateTokens', () => {
  it('returns 0 for an empty message list', () => {
    expect(estimateTokens([])).toBe(0);
  });

  it('grows with message content length', () => {
    const short = estimateTokens([{ role: 'user', content: 'hi' }]);
    const long = estimateTokens([{ role: 'user', content: 'hi'.repeat(100) }]);
    expect(long).toBeGreaterThan(short);
  });

  it('does not throw on assistant messages with empty content and tool calls', () => {
    expect(() =>
      estimateTokens([
        {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'c1', name: 'lookup', arguments: { id: 1 } }],
        },
      ]),
    ).not.toThrow();
  });

  it('counts tool call arguments, not just message content', () => {
    const withoutArgs = estimateTokens([
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'c1', name: 'lookup', arguments: {} }],
      },
    ]);
    const withArgs = estimateTokens([
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'c1', name: 'lookup', arguments: { query: 'x'.repeat(200) } },
        ],
      },
    ]);
    expect(withArgs).toBeGreaterThan(withoutArgs);
  });
});

describe('applyHistoryWindow', () => {
  it('returns an empty array unchanged when history is empty', () => {
    expect(applyHistoryWindow([], 1000)).toEqual([]);
  });

  it('returns the full history unchanged when it fits the budget', () => {
    const history = [...makeTurn(1), ...makeTurn(2)];
    expect(applyHistoryWindow(history, 100_000)).toEqual(history);
  });

  it('drops the oldest turns first when history exceeds the budget', () => {
    const turns = [
      makeTurn(1),
      makeTurn(2),
      makeTurn(3),
      makeTurn(4),
      makeTurn(5),
    ];
    const history = turns.flat();

    // Budget covers roughly the last two turns only.
    const budget = estimateTokens([...turns[3], ...turns[4]]) + 5;
    const windowed = applyHistoryWindow(history, budget);

    expect(windowed).toEqual([...turns[3], ...turns[4]]);
    expect(estimateTokens(windowed)).toBeLessThanOrEqual(budget);
  });

  it('always keeps the most recent turn even if it alone exceeds the budget', () => {
    const turns = [makeTurn(1), makeTurn(2, { contentLength: 5000 })];
    const history = turns.flat();

    const windowed = applyHistoryWindow(history, 10);

    expect(windowed).toEqual(turns[1]);
  });

  it('never splits a turn that contains a tool_call/tool_result pair', () => {
    const turns = [
      makeTurn(1, { withToolCall: true }),
      makeTurn(2, { withToolCall: true }),
      makeTurn(3),
    ];
    const history = turns.flat();

    // Budget lands mid-way through what would be turn 2 if we counted
    // message-by-message instead of turn-by-turn.
    const budget = estimateTokens(turns[1]) + estimateTokens(turns[2]) - 5;
    const windowed = applyHistoryWindow(history, budget);

    // Turn 2 must be either fully present or fully absent — never partial.
    const toolCallIds = windowed
      .filter((m: LlmMessage) => m.role === 'assistant' && m.toolCalls?.length)
      .flatMap((m: LlmMessage) => m.toolCalls!.map((c) => c.id));
    const toolResultIds = windowed
      .filter((m: LlmMessage) => m.role === 'tool')
      .map((m: LlmMessage) => m.toolCallId);

    expect(toolResultIds.sort()).toEqual(toolCallIds.sort());
  });

  it('the first kept message is always a user message', () => {
    const turns = [
      makeTurn(1, { withToolCall: true }),
      makeTurn(2),
      makeTurn(3),
    ];
    const history = turns.flat();

    const windowed = applyHistoryWindow(history, estimateTokens(turns[2]) + 1);

    expect(windowed[0]?.role).toBe('user');
  });

  it('returns history unchanged when it contains no user-role boundary', () => {
    // Defensive path: malformed/legacy history with no user message at all.
    const history: LlmMessage[] = [{ role: 'assistant', content: 'orphaned' }];
    expect(applyHistoryWindow(history, 1)).toEqual(history);
  });

  it('handles a long conversation by trimming while keeping recent turns intact', () => {
    const turns = Array.from({ length: 50 }, (_, i) =>
      makeTurn(i, { withToolCall: i % 3 === 0 }),
    );
    const history = turns.flat();
    const fullSize = estimateTokens(history);
    const budget = Math.floor(fullSize / 10);

    const windowed = applyHistoryWindow(history, budget);

    expect(windowed.length).toBeLessThan(history.length);
    expect(windowed[windowed.length - 1]).toEqual(
      turns[49][turns[49].length - 1],
    );
    expect(windowed[0]?.role).toBe('user');
  });

  it('does not drop a turn that fits when counted together, even if each turn rounds up on its own', () => {
    // Ceiling division is superadditive: ceil(a/4) + ceil(b/4) can exceed
    // ceil((a+b)/4). If applyHistoryWindow summed per-turn rounded token
    // counts instead of rounding once on the combined total, a budget that
    // exactly fits both turns together would still wrongly drop the older
    // one. Regression test for that exact failure mode.
    const olderTurn: LlmMessage[] = [{ role: 'user', content: 'a' }];
    const newestTurn: LlmMessage[] = [{ role: 'user', content: 'b' }];
    const history = [...olderTurn, ...newestTurn];

    const combinedBudget = estimateTokens(history);
    const windowed = applyHistoryWindow(history, combinedBudget);

    expect(windowed).toEqual(history);
  });
});
