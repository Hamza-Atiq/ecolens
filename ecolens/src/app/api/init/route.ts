import { NextRequest, NextResponse } from 'next/server';
import { getBackboardClient, getOrCreateAssistant } from '@/lib/backboard';

export async function POST(req: NextRequest) {
  try {
    const { threadId } = await req.json();
    const client = getBackboardClient();
    const assistantId = await getOrCreateAssistant();

    let resolvedThreadId: string = threadId;
    if (!resolvedThreadId) {
      const thread = await client.createThread(assistantId);
      resolvedThreadId = thread.threadId;
    }

    return NextResponse.json({ assistantId, threadId: resolvedThreadId });
  } catch (err) {
    console.error('Init error:', err);
    return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
  }
}
