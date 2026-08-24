import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function askClaudeForJSON(
  system: string,
  userMessage: string,
  maxTokens = 1500,
): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  if (!textBlock) {
    throw new Error("Claude response contained no text block");
  }
  return textBlock.text;
}

export interface StreamJSONLResult {
  totalMs: number;
  firstTokenMs: number | null;
}

/**
 * Streams a Claude response and invokes onLine for each complete newline-delimited
 * JSON line as it arrives (the model is prompted to emit one JSON object per line).
 */
export async function streamClaudeJSONL(
  system: string,
  userMessage: string,
  onLine: (line: string) => void,
  maxTokens = 1500,
): Promise<StreamJSONLResult> {
  const start = performance.now();
  let firstTokenMs: number | null = null;
  let buffer = "";

  const stream = getClient().messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  stream.on("text", (delta) => {
    if (firstTokenMs === null) firstTokenMs = performance.now() - start;
    buffer += delta;
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) onLine(line);
    }
  });

  await stream.finalMessage();

  const remaining = buffer.trim();
  if (remaining) onLine(remaining);

  return { totalMs: performance.now() - start, firstTokenMs };
}

/** Best-effort parse of a single JSONL line. Returns null (never throws) on failure. */
export function parseJSONLLine<T>(rawLine: string): T | null {
  const cleaned = rawLine
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

export function parseJSONResponse<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Claude occasionally slips a stray sentence before/after the JSON despite
    // instructions not to. Fall back to the outermost {...} span.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("Claude response did not contain a JSON object");
    }
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }
}
