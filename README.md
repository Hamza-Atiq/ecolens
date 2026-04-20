# 🌍 EcoLens — AI Eco-Companion

> Scan any object. Discover its environmental impact. Build greener habits over time.

Point your camera at any everyday object — a plastic bottle, a piece of clothing, a coffee cup — and Gemini 2.5 Flash Vision instantly returns a full eco-report. Backboard's persistent memory means EcoLens remembers your scan history and gives you increasingly personalised sustainability advice over time.

---

## ✨ Features

- **Instant eco-report** — carbon footprint (kg CO₂), planet score (0–100), recyclability breakdown, 3 greener swap suggestions, and a fun environmental fact
- **Persistent memory** — Backboard remembers every object you've ever scanned; on your second visit the app greets you with personalised advice referencing your history
- **Weekly eco-journey** — `/summary` page pulls your Backboard memories to generate an AI narrative of your sustainability progress, complete with a planet-score bar chart and trend badge
- **Mobile-first** — drag-drop or take a live photo directly from your phone camera
- **Zero database** — all state lives in Backboard; no backend infra to manage

---

## 🎬 Demo

[![EcoLens Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=sOcMjhSedcc)

🔗 **Live app:** https://ecolens-one.vercel.app/

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| AI Vision | Google Gemini 2.5 Flash via Backboard BYOK |
| Memory & State | Backboard SDK (persistent assistant memory) |
| Hosting | Vercel (free tier) |

---

## 🔑 How It Works

### Two Gemini calls per scan

1. **Vision analysis** — the uploaded image + a strict JSON prompt is sent to Gemini 2.5 Flash via Backboard's `addMessage` (with `files` and `json_output: true`). Returns the structured eco-report.
2. **Personalised advice** — a second call immediately after, with `memory: "Auto"`, asks Gemini to reference the user's full scan history and give specific encouragement.

### Backboard memory

- One `EcoLens Assistant` is created once and reused across all users
- Each user gets their own persistent thread (ID stored in `localStorage`)
- Every `addMessage` call uses `memory: "Auto"` — Backboard automatically extracts facts from each eco-report and stores them as memories
- The `/summary` page calls `getMemories()` to surface raw memories alongside a Gemini-generated weekly narrative

```
User uploads image
       ↓
/api/analyze → saves image to /tmp → Backboard addMessage (files + prompt)
       ↓                                          ↓
  Gemini Vision                         memory: "Auto" stores facts
       ↓
  Eco-report JSON → displayed to user
       ↓
  (if 2nd+ scan) → second addMessage → personalised memory-aware advice
```

---

## 🚀 Run Locally

### Prerequisites

- Node.js 18+
- A [Backboard](https://app.backboard.io) account with API key
- A [Google AI Studio](https://aistudio.google.com) Gemini API key added as BYOK in your Backboard dashboard

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/ecolens.git
cd ecolens
npm install
```

Create `.env.local`:

```
BACKBOARD_API_KEY=your_backboard_key_here
```

> Your Gemini API key goes into Backboard's BYOK settings (not in `.env.local`).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Add Gemini BYOK in Backboard

1. Log in to [app.backboard.io](https://app.backboard.io)
2. Go to Settings → API Keys / BYOK
3. Add your Gemini key with provider set to **Google**

---

**Author:** Hamza Atiq
