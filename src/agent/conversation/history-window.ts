import { LlmMessage } from '../llm/llm.types';

/**
 * Rough, provider-agnostic token estimate (~4 chars/token). Good enough for
 * a trim budget — it doesn't need to match the real tokenizer exactly, it
 * just needs to be monotonic with message size so the window stays bounded.
 */
const CHARS_PER_TOKEN_ESTIMATE = 4;

function countChars(messages: LlmMessage[]): number {
  let totalChars = 0;

  for (const message of messages) {
    totalChars += message.role.length;
    totalChars += (message.content ?? '').length;
    totalChars += message.name?.length ?? 0;
    totalChars += message.toolCallId?.length ?? 0;

    if (message.toolCalls?.length) {
      for (const call of message.toolCalls) {
        totalChars += call.id.length + call.name.length;
        totalChars += JSON.stringify(call.arguments).length;
      }
    }
  }

  return totalChars;
}

export function estimateTokens(messages: LlmMessage[]): number {
  return Math.ceil(countChars(messages) / CHARS_PER_TOKEN_ESTIMATE);
}

/**
 * Trims session history to fit a token budget by dropping the oldest whole
 * turns, never a partial one.
 *
 * A "turn" is everything from one user message up to (but not including)
 * the next user message. Cutting only at user-role boundaries guarantees
 * every kept assistant `toolCalls` still has its matching `tool` result
 * messages alongside it, and that the first kept message is always `user`
 * (both Anthropic and OpenAI expect the conversation to start there).
 *
 * The most recent turn is always kept in full, even if it alone exceeds the
 * budget — trimming that would drop the very message the model needs to
 * answer next.
 */
export function applyHistoryWindow(
  history: LlmMessage[],
  budgetTokens: number,
): LlmMessage[] {
  const turnStartIndexes = history.reduce<number[]>(
    (indexes, message, index) => {
      return message.role === 'user' ? [...indexes, index] : indexes;
    },
    [],
  );

  if (turnStartIndexes.length === 0) {
    // Defensive: malformed/legacy history with no user message at all —
    // nothing safe to cut, hand it back unchanged.
    return history;
  }

  // Walk turns newest-to-oldest, accumulating a running *character* total
  // instead of recomputing estimateTokens over an ever-larger candidate
  // slice each time — that would make trimming itself O(turns × messages)
  // on exactly the long sessions this function exists to protect.
  //
  // Rounding to tokens happens once, on the accumulated total, not once per
  // turn: summing independently-rounded per-turn token counts would
  // over-estimate the true combined size (ceiling division is superadditive:
  // ceil(a/n) + ceil(b/n) >= ceil((a+b)/n)), causing turns to be dropped
  // that would actually still fit the budget.
  let runningChars = 0;
  let chosenStart = turnStartIndexes[turnStartIndexes.length - 1];

  for (let i = turnStartIndexes.length - 1; i >= 0; i--) {
    const turnStart = turnStartIndexes[i];
    const turnEnd =
      i + 1 < turnStartIndexes.length
        ? turnStartIndexes[i + 1]
        : history.length;
    const turnChars = countChars(history.slice(turnStart, turnEnd));
    const isMostRecentTurn = i === turnStartIndexes.length - 1;
    const projectedTokens = Math.ceil(
      (runningChars + turnChars) / CHARS_PER_TOKEN_ESTIMATE,
    );

    if (!isMostRecentTurn && projectedTokens > budgetTokens) {
      break;
    }

    runningChars += turnChars;
    chosenStart = turnStart;
  }

  return history.slice(chosenStart);
}
