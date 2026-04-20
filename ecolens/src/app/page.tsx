'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import EcoReport, { EcoReportData } from '@/components/EcoReport';
import PersonalizedPanel from '@/components/PersonalizedPanel';

export default function Home() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<EcoReportData | null>(null);
  const [personalizedMessage, setPersonalizedMessage] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedThread = localStorage.getItem('ecolens_thread_id');
    const storedCount = parseInt(localStorage.getItem('ecolens_scan_count') ?? '0', 10);
    setScanCount(storedCount);

    fetch('/api/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: storedThread }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Init failed');
        const { assistantId, threadId: tid } = await res.json();
        localStorage.setItem('ecolens_thread_id', tid);
        localStorage.setItem('ecolens_assistant_id', assistantId);
        setThreadId(tid);
        setIsInitialized(true);
      })
      .catch(() => setError('Failed to connect. Check your Backboard API key.'));
  }, []);

  const handleImageSelected = async (base64: string, mimeType: string) => {
    if (!threadId) return;
    setIsAnalyzing(true);
    setReport(null);
    setPersonalizedMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType, threadId, scanCount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed');
        return;
      }

      setReport(data.report);
      if (data.personalizedMessage) setPersonalizedMessage(data.personalizedMessage);

      const newCount = scanCount + 1;
      setScanCount(newCount);
      localStorage.setItem('ecolens_scan_count', String(newCount));

      // Track planet scores for summary stats
      const prevScores = JSON.parse(localStorage.getItem('ecolens_scores') ?? '[]') as number[];
      prevScores.push(data.report.planet_score);
      localStorage.setItem('ecolens_scores', JSON.stringify(prevScores));

      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌍</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            EcoLens
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Scan any object · Discover its environmental impact
          </p>
          {scanCount > 0 && (
            <Link
              href="/summary"
              className="inline-block mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
            >
              View your eco journey ({scanCount} scan{scanCount !== 1 ? 's' : ''}) →
            </Link>
          )}
        </div>

        {!isInitialized && !error && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-4">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Connecting to EcoLens…
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 mb-4 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {isInitialized && (
          <ImageUpload onImageSelected={handleImageSelected} isAnalyzing={isAnalyzing} />
        )}

        {report && (
          <div ref={reportRef} className="mt-6 space-y-4">
            <EcoReport report={report} />
            {personalizedMessage && (
              <PersonalizedPanel message={personalizedMessage} scanCount={scanCount} />
            )}
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-10">
          Powered by Gemini 2.5 Flash · Memory by Backboard
        </p>
      </div>
    </main>
  );
}
