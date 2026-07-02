import { callAnthropic } from './anthropic.js';
import { callOpenAI } from './openai.js';
import { callMock } from './mock.js';

export const providers = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  mock: callMock,
};

export function getProvider(name) {
  const fn = providers[name];
  if (!fn) {
    throw new Error(
      `Unknown provider "${name}". Available: ${Object.keys(providers).join(', ')}`
    );
  }
  return fn;
}
