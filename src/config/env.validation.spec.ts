import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const baseEnv = {
    ANTHROPIC_API_KEY: 'key',
    CHIOMA_API_URL: 'http://localhost:3000',
  };

  it('passes with the minimum required anthropic config', () => {
    expect(() => validateEnvironment(baseEnv)).not.toThrow();
  });

  it('rejects an unknown LLM_PROVIDER', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, LLM_PROVIDER: 'not-a-provider' }),
    ).toThrow(/LLM_PROVIDER must be/);
  });

  it('requires OPENAI_API_KEY when LLM_PROVIDER=openai', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, LLM_PROVIDER: 'openai' }),
    ).toThrow(/OPENAI_API_KEY is required/);
  });

  it('accepts LLM_PROVIDER=openai when the key is present', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        LLM_PROVIDER: 'openai',
        OPENAI_API_KEY: 'key',
      }),
    ).not.toThrow();
  });

  it('accepts a valid LLM_MODEL for the anthropic provider', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, LLM_MODEL: 'claude-opus-4-8' }),
    ).not.toThrow();
  });

  it('rejects an unknown LLM_MODEL', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, LLM_MODEL: 'claude-opus-4.8-typo' }),
    ).toThrow(/LLM_MODEL .* is not a recognized model/);
  });

  it('accepts a valid LLM_MODEL for the openai provider', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        LLM_PROVIDER: 'openai',
        OPENAI_API_KEY: 'key',
        LLM_MODEL: 'gpt-4o',
      }),
    ).not.toThrow();
  });

  it('rejects a model that belongs to a different provider', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        LLM_PROVIDER: 'openai',
        OPENAI_API_KEY: 'key',
        LLM_MODEL: 'claude-opus-4-8',
      }),
    ).toThrow(/LLM_MODEL .* is not a recognized model/);
  });

  it('requires CHIOMA_API_URL', () => {
    expect(() => validateEnvironment({ ANTHROPIC_API_KEY: 'key' })).toThrow(
      /CHIOMA_API_URL is required/,
    );
  });

  it('requires REDIS_URL when SESSION_STORE=redis', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, SESSION_STORE: 'redis' }),
    ).toThrow(/REDIS_URL is required/);
  });

  it('accepts SESSION_STORE=redis when REDIS_URL is present', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        SESSION_STORE: 'redis',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).not.toThrow();
  });

  it('collects multiple errors into a single thrown message', () => {
    expect(() => validateEnvironment({})).toThrow(
      /ANTHROPIC_API_KEY is required.*CHIOMA_API_URL is required/s,
    );
  });

  it('accepts a valid HISTORY_TOKEN_BUDGET', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, HISTORY_TOKEN_BUDGET: '5000' }),
    ).not.toThrow();
  });

  it('accepts a missing HISTORY_TOKEN_BUDGET (falls back to the default)', () => {
    expect(() => validateEnvironment(baseEnv)).not.toThrow();
  });

  it('rejects a non-numeric HISTORY_TOKEN_BUDGET', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, HISTORY_TOKEN_BUDGET: 'not-a-number' }),
    ).toThrow(/HISTORY_TOKEN_BUDGET must be a positive number/);
  });

  it('rejects a zero or negative HISTORY_TOKEN_BUDGET', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, HISTORY_TOKEN_BUDGET: '0' }),
    ).toThrow(/HISTORY_TOKEN_BUDGET must be a positive number/);
    expect(() =>
      validateEnvironment({ ...baseEnv, HISTORY_TOKEN_BUDGET: '-100' }),
    ).toThrow(/HISTORY_TOKEN_BUDGET must be a positive number/);
  });
});
