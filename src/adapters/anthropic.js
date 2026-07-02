const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Call the Anthropic Messages API.
 * Requires ANTHROPIC_API_KEY in the environment.
 */
export async function callAnthropic({ model, system, prompt, maxTokens = 1024, temperature }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Export it in your shell or add it to a .env file.'
    );
  }

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (system) body.system = system;
  if (temperature !== undefined) body.temperature = temperature;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const textBlocks = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text);
  return {
    text: textBlocks.join('\n'),
    raw: data,
    usage: data.usage,
  };
}
