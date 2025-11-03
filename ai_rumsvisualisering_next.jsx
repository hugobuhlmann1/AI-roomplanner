// ================================================================
// AI-RUMSVISUALISERING – NEXT.JS + VERCEL (KLART ATT PUBLICERA)
// ---------------------------------------------------------------
// Så här använder du projektet när du har klonat det till GitHub:
// 1) Skapa en .env-fil (se .env.example nedan) och lägg in din OPENAI_API_KEY.
// 2) På Vercel: Importera repo → lägg till Environment Variable OPENAI_API_KEY.
// 3) Deploya. Klart! Du får en URL där formuläret genererar bilder.
// ---------------------------------------------------------------
// Filöversikt:
// - package.json
// - next.config.mjs
// - tsconfig.json
// - .env.example
// - app/layout.tsx
// - app/globals.css
// - app/page.tsx (UI + formulär)
// - app/api/generate/route.ts (API som anropar OpenAI Images)
// - components/RoomForm.tsx (formulärkomponent)
// - components/ResultViewer.tsx (visar genererad bild)
// - lib/prompt.ts (bygger strikt prompt av fält)
// - lib/validators.ts (validering)
// ================================================================

// =========================
// File: package.json
// =========================
{
  "name": "ai-rum-visualisering",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "openai": "4.73.1",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@types/node": "22.7.5",
    "@types/react": "18.3.7",
    "@types/react-dom": "18.3.0",
    "eslint": "9.12.0",
    "eslint-config-next": "14.2.15",
    "typescript": "5.6.3"
  }
}

// =========================
// File: next.config.mjs
// =========================
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  }
};
export default nextConfig;

// =========================
// File: tsconfig.json
// =========================
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}

// =========================
// File: .env.example
// =========================
// Kopiera till .env (lokalt) och fyll i nyckeln.
// På Vercel lägger du samma nyckel i Project Settings → Environment Variables
//
// OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// =========================
// File: app/globals.css
// =========================
:root {
  --bg: #0b0c10;
  --card: #111319;
  --muted: #9aa3b2;
  --accent: #5ee0ff;
  --text: #e7eef7;
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  background: linear-gradient(180deg, #0b0c10 0%, #0e1117 100%);
  color: var(--text);
}
.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}
.card {
  background: var(--card);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}
.h {
  font-weight: 800; font-size: 28px; letter-spacing: 0.2px; margin: 0 0 6px;
}
.p { color: var(--muted); margin: 0 0 22px; }
.grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media(min-width:900px){ .grid { grid-template-columns: 1fr 1fr; } }
.label { display:block; font-weight:600; margin-bottom:6px; }
.input, .select, .number {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: var(--text);
}
.row { display:flex; gap:10px; align-items:center; }
.button {
  appearance:none; border:none; cursor:pointer; font-weight:700;
  padding: 12px 16px; border-radius: 12px; color:#081018; background: var(--accent);
}
.button:disabled { opacity:.6; cursor:not-allowed; }
.helper { font-size: 12px; color: var(--muted); margin-top:6px; }
.center { display:flex; align-items:center; justify-content:center; }
.imgwrap { position:relative; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); }
.small { font-size:12px; color: var(--muted); }
.err { color:#ff9ea3; font-weight:600; }

// =========================
// File: app/layout.tsx
// =========================
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Rumsvisualisering",
  description: "Skriv mått & önskemål – få en fotorealistisk visualisering",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}

// =========================
// File: app/page.tsx
// =========================
"use client";
import { useState } from "react";
import RoomForm from "@/components/RoomForm";
import ResultViewer from "@/components/ResultViewer";

export default function Page() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (payload: any) => {
    setLoading(true); setError(null); setImage(null);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const t = await r.json().catch(() => ({}));
        throw new Error(t?.error || `Något gick fel (${r.status})`);
      }
      const data = await r.json();
      setImage(data.imageDataUrl);
    } catch (e: any) {
      setError(e.message || "Kunde inte generera bild.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h1 className="h">AI-rumsvisualisering</h1>
        <p className="p">Fyll i mått och önskemål. Vi visualiserar rummet fotorealistiskt. Avsett för inspirations- och offertunderlag – inte bygghandlingar.</p>
        <RoomForm onSubmit={onSubmit} disabled={loading} />
      </div>
      <div className="card">
        <h2 className="h">Resultat</h2>
        <p className="p small">Första bilden tar oftast längst tid. Spara bilden genom högerklick → "Spara bild som".</p>
        {error && <p className="err">{error}</p>}
        <ResultViewer image={image} loading={loading} />
      </div>
    </div>
  );
}

// =========================
// File: app/api/generate/route.ts
// =========================
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPrompt } from "@/lib/prompt";
import { formSchema } from "@/lib/validators";

export const runtime = "nodejs"; // Kör på Node-runtime (stabilt för SDK)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ogiltiga fält", details: parsed.error.flatten() }, { status: 400 });
    }

    const prompt = buildPrompt(parsed.data);

    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: parsed.data.size, // t.ex. "1536x1024" (liggande)
      // Du kan lägga till "background: 'transparent'" om du behöver PNG med transparens
    });

    const b64 = img.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "Inget bildresultat från modellen." }, { status: 502 });
    }

    const imageDataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ imageDataUrl }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Internt fel" }, { status: 500 });
  }
}

// =========================
// File: components/RoomForm.tsx
// =========================
"use client";
import { useState } from "react";

export type FormValues = {
  wallColor: string;
  doorOffsetMm: number;
  doorSwing: "öppnas inåt höger" | "öppnas inåt vänster";
  ceilingMm: number;
  roomWmm: number;
  roomDmm: number;
  style: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
};

export default function RoomForm({ onSubmit, disabled }: { onSubmit: (v: FormValues) => void; disabled?: boolean; }) {
  const [values, setValues] = useState<FormValues>({
    wallColor: "Blå väggar (NCS S 5020-R90B som känsla)",
    doorOffsetMm: 100,
    doorSwing: "öppnas inåt höger",
    ceilingMm: 2500,
    roomWmm: 3000,
    roomDmm: 3000,
    style: "modern, fotorealistisk, neutralt dagsljus, normal lins (35–50mm)",
    size: "1536x1024"
  });

  const set = (k: keyof FormValues, v: any) => setValues(prev => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={submit}>
      <div className="grid">
        <div>
          <label className="label">Väggfärg / kulörbeskrivning</label>
          <input className="input" value={values.wallColor} onChange={e => set("wallColor", e.target.value)} placeholder="t.ex. Blå väggar, helmatt" />
          <div className="helper">Du kan ange valfri beskrivning (NCS/RAL som känsla). Modellen tolkar färgton, inte exakta färgkoder.</div>
        </div>
        <div>
          <label className="label">Dörrens mitt (CC) från vänster vägg (mm)</label>
          <input className="number" type="number" min={0} value={values.doorOffsetMm} onChange={e => set("doorOffsetMm", Number(e.target.value))} />
          <div className="helper">Exempel: 100 betyder att dörrens mittpunkt är 100 mm från vänster vägg.</div>
        </div>
        <div>
          <label className="label">Dörrens öppningsriktning</label>
          <select className="select" value={values.doorSwing} onChange={e => set("doorSwing", e.target.value)}>
            <option value="öppnas inåt höger">Öppnas inåt höger</option>
            <option value="öppnas inåt vänster">Öppnas inåt vänster</option>
          </select>
        </div>
        <div>
          <label className="label">Takhöjd (mm)</label>
          <input className="number" type="number" min={2000} value={values.ceilingMm} onChange={e => set("ceilingMm", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Rumsbredd (mm)</label>
          <input className="number" type="number" min={1000} value={values.roomWmm} onChange={e => set("roomWmm", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Rumsdjup (mm)</label>
          <input className="number" type="number" min={1000} value={values.roomDmm} onChange={e => set("roomDmm", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Stil/ljus/ton</label>
          <input className="input" value={values.style} onChange={e => set("style", e.target.value)} placeholder="t.ex. sekelskifte, varm ton, fotorealistisk" />
        </div>
        <div>
          <label className="label">Bildstorlek</label>
          <select className="select" value={values.size} onChange={e => set("size", e.target.value)}>
            <option value="1536x1024">1536×1024 (liggande)</option>
            <option value="1024x1024">1024×1024</option>
            <option value="1024x1536">1024×1536 (stående)</option>
          </select>
        </div>
      </div>
      <div style={{ height: 12 }} />
      <button className="button" type="submit" disabled={disabled}>Generera bild</button>
      <div className="helper" style={{ marginTop: 8 }}>
        Tips: För millimeter-noggrannhet är detta en visualisering, inte CAD. Lägg gärna exakta mått i fälten ovan.
      </div>
    </form>
  );
}

// =========================
// File: components/ResultViewer.tsx
// =========================
"use client";
export default function ResultViewer({ image, loading }: { image: string | null; loading: boolean; }) {
  if (loading) {
    return (
      <div className="center" style={{ minHeight: 300 }}>
        <div className="small">Genererar bild… detta kan ta en liten stund.</div>
      </div>
    );
  }
  if (!image) {
    return <div className="small">Inget resultat ännu. Fyll i formuläret och klicka "Generera bild".</div>;
  }
  return (
    <div className="imgwrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="Genererad visualisering" style={{ width: "100%", display: "block" }} />
    </div>
  );
}

// =========================
// File: lib/prompt.ts
// =========================
import type { z } from "zod";
import { formSchema } from "./validators";

export function buildPrompt(values: z.infer<typeof formSchema>): string {
  const {
    wallColor,
    doorOffsetMm,
    doorSwing,
    ceilingMm,
    roomWmm,
    roomDmm,
    style
  } = values;

  return `Skapa en fotorealistisk interiörrendering av ett tomt rektangulärt rum i normal kameraperspektiv.
KRAV PÅ GEOMETRI (följ exakt i proportioner):
- Innermått: bredd ${roomWmm} mm × djup ${roomDmm} mm; takhöjd ${ceilingMm} mm.
- En innerdörr i främre väggen: dörrens mittpunkt (CC) är ${doorOffsetMm} mm från vänster vägg. Dörrblad ${doorSwing}. Standarddörr ~2040×830 mm, handtag i normal höjd.
- Väggfärg/finish: ${wallColor}.
- Inga möbler. Raka väggar, enkel golvsockel.
- Korrekt linjeperspektiv, realistiska skuggor och material.
STIL: ${style}.
FORMAT: Liggande/stående enligt begärd storlek. Ingen text i bilden.`;
}

// =========================
// File: lib/validators.ts
// =========================
import { z } from "zod";

export const formSchema = z.object({
  wallColor: z.string().min(1),
  doorOffsetMm: z.number().int().nonnegative(),
  doorSwing: z.enum(["öppnas inåt höger", "öppnas inåt vänster"]),
  ceilingMm: z.number().int().min(2000).max(4000),
  roomWmm: z.number().int().min(1000).max(20000),
  roomDmm: z.number().int().min(1000).max(20000),
  style: z.string().min(1),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]) // skickas direkt till API:t
});

// =========================
// File: next-env.d.ts
// =========================
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
