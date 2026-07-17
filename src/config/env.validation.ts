export type LlmProvider = 'openai' | 'anthropic';
export type SessionStore = 'memory' | 'redis';

export interface RootConfig {
  app: AppConfig;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  llmProvider: LlmProvider;
  llmModel: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  chiomaApiUrl: string;
  chiomaApiToken?: string;
  stellarHorizonUrl: string;
  sessionStore: SessionStore;
  redisUrl: string;
  sessionTtlSeconds: number;
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Wired into ConfigModule.forRoot({ validate }) so misconfiguration fails at
 * boot rather than surfacing as a confusing runtime error mid-conversation.
 */
export function validateEnvironment(
  env: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];

  const llmProvider = (env.LLM_PROVIDER as string) || 'anthropic';
  if (llmProvider !== 'openai' && llmProvider !== 'anthropic') {
    errors.push('LLM_PROVIDER must be "openai" or "anthropic"');
  }
  if (llmProvider === 'openai' && !isNonEmpty(env.OPENAI_API_KEY)) {
    errors.push('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
  }
  if (llmProvider === 'anthropic' && !isNonEmpty(env.ANTHROPIC_API_KEY)) {
    errors.push('ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic');
  }

  if (!isNonEmpty(env.CHIOMA_API_URL)) {
    errors.push('CHIOMA_API_URL is required');
  }

  const sessionStore = (env.SESSION_STORE as string) || 'memory';
  if (sessionStore !== 'memory' && sessionStore !== 'redis') {
    errors.push('SESSION_STORE must be "memory" or "redis"');
  }
  if (sessionStore === 'redis' && !isNonEmpty(env.REDIS_URL)) {
    errors.push('REDIS_URL is required when SESSION_STORE=redis');
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join('\n  - ')}`,
    );
  }

  return env;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3100', 10),
    llmProvider: (process.env.LLM_PROVIDER as LlmProvider) ?? 'anthropic',
    llmModel: process.env.LLM_MODEL ?? 'claude-opus-4-8',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    chiomaApiUrl: process.env.CHIOMA_API_URL ?? 'http://localhost:3000',
    chiomaApiToken: process.env.CHIOMA_API_TOKEN,
    stellarHorizonUrl:
      process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
    sessionStore: (process.env.SESSION_STORE as SessionStore) ?? 'memory',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    sessionTtlSeconds: parseInt(
      process.env.SESSION_TTL_SECONDS ?? '3600',
      10,
    ),
  };
}
