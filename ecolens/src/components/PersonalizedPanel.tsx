'use client';

interface Props {
  message: string;
  scanCount: number;
}

export default function PersonalizedPanel({ message, scanCount }: Props) {
  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800/60 rounded-2xl p-6 border border-emerald-700/40">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <h3 className="text-emerald-400 font-semibold">EcoLens Remembers You</h3>
        <span className="ml-auto text-xs text-slate-500 bg-slate-700/60 px-2 py-1 rounded-full">
          {scanCount} scan{scanCount !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
      <p className="text-xs text-slate-600 mt-3">
        Powered by Backboard persistent memory · Gemini 2.5 Flash
      </p>
    </div>
  );
}
