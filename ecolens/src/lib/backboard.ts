import { BackboardClient } from 'backboard-sdk';

const ASSISTANT_NAME = 'EcoLens Assistant';
const SYSTEM_PROMPT =
  "You are EcoLens, an AI eco-companion. You analyze objects for their environmental impact and remember users' scan history to provide personalized sustainability advice. You are encouraging, specific, and always grounded in real environmental data.";

let _client: BackboardClient | null = null;

export function getBackboardClient(): BackboardClient {
  if (!_client) {
    _client = new BackboardClient({ apiKey: process.env.BACKBOARD_API_KEY! });
  }
  return _client;
}

export async function getOrCreateAssistant(): Promise<string> {
  const client = getBackboardClient();
  const assistants = await client.listAssistants({ limit: 100 });
  const existing = (assistants as Array<{ assistantId: string; name: string }>).find(
    (a) => a.name === ASSISTANT_NAME
  );
  if (existing) return existing.assistantId;

  const assistant = await client.createAssistant({
    name: ASSISTANT_NAME,
    system_prompt: SYSTEM_PROMPT,
  });
  return assistant.assistantId;
}
