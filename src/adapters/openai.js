const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Call the OpenAI Chat Completions API.
 * Requires OPENAI_API_KEY in the environment.
 */
export async function callOpenAI({ model, system, prompt, maxTokens = 1024, temperature }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Export it in your shell or add it to a .env file.'
    );
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const body = { model, messages, max_tokens: maxTokens };
  if (temperature !== undefined) body.temperature = temperature;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    raw: data,
    usage: data.usage,
  };
}
