'use client';
import { useRef, useState, useCallback } from 'react';

interface Props {
  onImageSelected: (base64: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUpload({ onImageSelected, isAnalyzing }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or WEBP image.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('Image must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        onImageSelected(dataUrl.split(',')[1], file.type);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full">
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />

      <div
        onClick={() => !isAnalyzing && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center min-h-[240px] overflow-hidden ${
          dragOver
            ? 'border-emerald-400 bg-emerald-950/30'
            : 'border-slate-600 bg-slate-800/50 hover:border-emerald-500 hover:bg-slate-800'
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="max-h-[320px] w-full object-contain rounded-xl" />
        ) : (
          <div className="text-center p-8 select-none">
            <div className="text-5xl mb-3">🌿</div>
            <p className="text-slate-300 text-lg font-medium">Drop an image here</p>
            <p className="text-slate-500 text-sm mt-1">or click to browse</p>
            <p className="text-slate-600 text-xs mt-3">JPEG · PNG · WEBP · max 5MB</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-emerald-400 font-semibold">Analyzing with Gemini 2.5 Flash…</p>
            <p className="text-slate-500 text-xs mt-1">This takes a few seconds</p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={() => !isAnalyzing && cameraRef.current?.click()}
        disabled={isAnalyzing}
        className="mt-3 w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        📷 Take a Photo
      </button>
    </div>
  );
}
