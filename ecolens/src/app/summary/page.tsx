'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Memory {
  id: string;
  content: string;
}

interface Stats {
  scanCount: number;
  avgScore: number;
  trend: 'up' | 'down' | 'steady' | 'new';
  scores: number[];
}

function computeStats(): Stats {
  const scanCount = parseInt(localStorage.getItem('ecolens_scan_count') ?? '0', 10);
  const scores: number[] = JSON.parse(localStorage.getItem('ecolens_scores') ?? '[]');
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  let trend: Stats['trend'] = 'new';
  if (scores.length >= 3) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 3) trend = 'up';
    else if (firstAvg - secondAvg > 3) trend = 'down';
    else trend = 'steady';
  } else if (scores.length > 0) {
    trend = 'steady';
  }

  return { scanCount, avgScore: avg, trend, scores };
}

const TREND_CONFIG = {
  up: { emoji: '📈', label: 'Trending Greener', color: 'text-emerald-400' },
  down: { emoji: '📉', label: 'Room to Improve', color: 'text-amber-400' },
  steady: { emoji: '➡️', label: 'Holding Steady', color: 'text-blue-400' },
  new: { emoji: '🌱', label: 'Just Getting Started', color: 'text-slate-400' },
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? 'bg-emerald-500' : s >= 40 ? 'bg-amber-500' : 'bg-red-500';

export default function SummaryPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invoke
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const computed = computeStats();
    setStats(computed);

    const assistantId = localStorage.getItem('ecolens_assistant_id');
    const threadId = localStorage.getItem('ecolens_thread_id');

    if (!assistantId || !threadId || computed.scanCount === 0) {
      setError('No scan history yet. Go scan something first!');
      setLoading(false);
      return;
    }

    fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assistantId, threadId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load');
        setSummary(data.summary);
        setMemories(data.memories ?? []);
        setError(null); // clear any prior error
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const trend = stats ? TREND_CONFIG[stats.trend] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Your Eco Journey</h1>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.scanCount}</div>
              <div className="text-slate-500 text-xs mt-1">Scans</div>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 text-center">
              <div className="text-3xl font-bold text-white">{stats.avgScore || '—'}</div>
              <div className="text-slate-500 text-xs mt-1">Avg Score</div>
            </div>
            {trend && (
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 text-center">
                <div className="text-2xl">{trend.emoji}</div>
                <div className={`text-xs mt-1 font-medium ${trend.color}`}>{trend.label}</div>
              </div>
            )}
          </div>
        )}

        {/* Score history bar chart */}
        {stats && stats.scores.length > 0 && (
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 mb-5">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">
              Planet Score History
            </p>
            <div className="flex items-end gap-1.5 h-14">
              {stats.scores.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm ${SCORE_COLOR(score)} opacity-80`}
                    style={{ height: `${(score / 100) * 48}px`, minHeight: '4px' }}
                  />
                  <span className="text-slate-600 text-xs">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Generating your weekly summary…</p>
          </div>
        )}

        {/* Error — only show if no summary loaded */}
        {error && !summary && (
          <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-400 text-sm mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* AI Summary */}
        {summary && (
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 mb-5">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">
              🌱 Weekly Eco Summary
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
            <p className="text-xs text-slate-600 mt-4">
              Generated by Gemini 2.5 Flash · Powered by Backboard memory
            </p>
          </div>
        )}

        {/* Memories */}
        {memories.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">
              🧠 What EcoLens Knows About You
            </p>
            <div className="space-y-2">
              {memories.slice(0, 10).map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/50"
                >
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✦</span>
                  <p className="text-slate-300 text-sm">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && memories.length === 0 && summary && (
          <p className="text-slate-600 text-sm text-center mt-4">
            Keep scanning — memories build up after a few more objects.
          </p>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            + Scan Another Object
          </Link>
        </div>
      </div>
    </main>
  );
}
