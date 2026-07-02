/**
 * Mock adapter — returns deterministic canned output so the harness can be
 * demoed, tested in CI, or run offline without any API key. Useful for
 * validating suite files before spending real tokens.
 */
export async function callMock({ prompt }) {
  return {
    text: `[mock response] echo: ${prompt}`,
    raw: null,
    usage: null,
  };
}
