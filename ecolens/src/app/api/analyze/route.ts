import { NextRequest, NextResponse } from 'next/server';
import { getBackboardClient } from '@/lib/backboard';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const ECO_PROMPT = `Analyze the object in this image for its environmental impact. Return ONLY valid JSON with no markdown fences, no preamble, no explanation. Use exactly this schema:
{"object":"string","carbon_kg":number,"carbon_label":"Low Impact or Medium Impact or High Impact","recyclable":["string"],"not_recyclable":["string"],"eco_swaps":["string","string","string"],"planet_score":number,"fun_fact":"string"}
Rules: carbon_label must be exactly "Low Impact", "Medium Impact", or "High Impact". planet_score is 0-100 (higher=greener). eco_swaps must have exactly 3 items. recyclable and not_recyclable list individual components of the object.`;

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const { imageBase64, mimeType, threadId, scanCount } = await req.json();

    if (!imageBase64 || !mimeType || !threadId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Use JPEG, PNG, or WEBP.' },
        { status: 400 }
      );
    }

    const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    tmpPath = join(tmpdir(), `ecolens_${Date.now()}.${ext}`);
    writeFileSync(tmpPath, Buffer.from(imageBase64, 'base64'));

    const client = getBackboardClient();
    let report: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = (await client.addMessage(threadId, {
        content: ECO_PROMPT,
        files: [tmpPath],
        llm_provider: 'google',
        model_name: 'gemini-2.5-flash',
        memory: 'Auto',
        json_output: true,
      })) as { content: string };

      try {
        let raw: string = response.content ?? '';
        raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        report = JSON.parse(raw);
        break;
      } catch {
        if (attempt === 1) {
          return NextResponse.json(
            { error: 'Failed to parse eco-report. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    // Second Gemini call for personalized memory-aware response (returning users)
    let personalizedMessage: string | null = null;
    if (scanCount >= 1) {
      try {
        const personalResp = (await client.addMessage(threadId, {
          content:
            'Based on my scan history, give me 2-3 sentences of personalized eco-advice that references what I have scanned before. Be specific and encouraging.',
          llm_provider: 'google',
          model_name: 'gemini-2.5-flash',
          memory: 'Auto',
        })) as { content: string };
        personalizedMessage = personalResp.content ?? null;
      } catch {
        // Non-critical — silently skip
      }
    }

    return NextResponse.json({ report, personalizedMessage });
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  } finally {
    if (tmpPath) {
      try {
        unlinkSync(tmpPath);
      } catch {}
    }
  }
}
