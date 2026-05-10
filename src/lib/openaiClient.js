export function hasOpenAIKey() {
  return Boolean(globalThis.__AUTOHDR_CONFIG__?.hasOpenAIKey);
}

export async function refineShotPrompt(shot) {
  const response = await fetch("/api/openai/refine-shot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ shot })
  });
  return response.json();
}
