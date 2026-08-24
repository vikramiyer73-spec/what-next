export async function consumeNDJSON<T>(res: Response, onItem: (item: T) => void): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          try {
            onItem(JSON.parse(line) as T);
          } catch {
            // skip malformed line
          }
        }
      }
    }
    if (done) break;
  }

  const remaining = buffer.trim();
  if (remaining) {
    try {
      onItem(JSON.parse(remaining) as T);
    } catch {
      // skip malformed trailing content
    }
  }
}
