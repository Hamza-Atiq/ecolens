import { NextRequest, NextResponse } from 'next/server';
import { getBackboardClient } from '@/lib/backboard';

export async function POST(req: NextRequest) {
  try {
    const { assistantId, threadId } = await req.json();

    if (!assistantId || !threadId) {
      return NextResponse.json({ error: 'Missing assistantId or threadId' }, { status: 400 });
    }

    const client = getBackboardClient();

    const [memoriesResult, summaryResult] = await Promise.allSettled([
      client.getMemories(assistantId, { page: 1, pageSize: 50 }),
      client.addMessage(threadId, {
        content:
          'Generate a brief weekly eco-journey summary for this user. Mention the types of objects they have been scanning, their overall environmental awareness trend, and one specific achievement to celebrate. Keep it to 3-4 sentences, warm and encouraging.',
        llm_provider: 'google',
        model_name: 'gemini-2.5-flash',
        memory: 'Auto',
      }),
    ]);

    // Summary is critical — fail if it errored
    if (summaryResult.status === 'rejected') {
      console.error('Summary generation failed:', summaryResult.reason);
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    const summaryContent = (summaryResult.value as { content: string }).content ?? '';

    // Memories are non-critical — degrade gracefully
    const rawMemories =
      memoriesResult.status === 'fulfilled'
        ? ((memoriesResult.value as { memories: Array<{ id: string; content: string }> }).memories ?? [])
        : [];

    // Deduplicate by content (Backboard can store duplicates)
    const seen = new Set<string>();
    const memories = rawMemories.filter((m) => {
      const key = m.content.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ summary: summaryContent, memories });
  } catch (err) {
    console.error('Summary error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
