'use client';

export interface EcoReportData {
  object: string;
  carbon_kg: number;
  carbon_label: 'Low Impact' | 'Medium Impact' | 'High Impact';
  recyclable: string[];
  not_recyclable: string[];
  eco_swaps: string[];
  planet_score: number;
  fun_fact: string;
}

function PlanetScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
      <svg className="absolute" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="72" cy="72" r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 72 72)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-bold text-white">{score}</div>
        <div className="text-xs text-slate-400">Planet Score</div>
      </div>
    </div>
  );
}

const LABEL_STYLES: Record<string, string> = {
  'Low Impact': 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
  'Medium Impact': 'bg-amber-900/50 text-amber-400 border border-amber-700',
  'High Impact': 'bg-red-900/50 text-red-400 border border-red-700',
};

export default function EcoReport({ report }: { report: EcoReportData }) {
  return (
    <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700 space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white capitalize truncate">{report.object}</h2>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${LABEL_STYLES[report.carbon_label] ?? ''}`}>
            {report.carbon_label}
          </span>
        </div>
        <PlanetScoreRing score={report.planet_score} />
      </div>

      {/* Carbon footprint */}
      <div className="bg-slate-900/50 rounded-xl p-4">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Carbon Footprint</p>
        <p className="text-white text-2xl font-bold">
          {report.carbon_kg}{' '}
          <span className="text-base font-normal text-slate-400">kg CO₂</span>
        </p>
      </div>

      {/* Recyclability */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2">♻️ Recyclable</p>
          {report.recyclable.length > 0 ? (
            <ul className="space-y-1">
              {report.recyclable.map((item, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-1.5">
                  <span className="text-emerald-400">✓</span> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">None</p>
          )}
        </div>
        <div>
          <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-2">🚫 Not Recyclable</p>
          {report.not_recyclable.length > 0 ? (
            <ul className="space-y-1">
              {report.not_recyclable.map((item, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-1.5">
                  <span className="text-red-400">✗</span> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">None</p>
          )}
        </div>
      </div>

      {/* Eco swaps */}
      <div>
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2">🌱 Eco Swaps</p>
        <ul className="space-y-2">
          {report.eco_swaps.map((swap, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-300 text-sm bg-emerald-950/30 rounded-lg px-3 py-2">
              <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
              {swap}
            </li>
          ))}
        </ul>
      </div>

      {/* Fun fact */}
      <div className="bg-blue-950/30 rounded-xl p-4 border border-blue-900/30">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">💡 Did You Know?</p>
        <p className="text-slate-300 text-sm leading-relaxed">{report.fun_fact}</p>
      </div>
    </div>
  );
}
