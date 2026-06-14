"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import tercoData from "@/data/terco.json";

// ─── Types ───────────────────────────────────────────────────────────────────

type MysteryKey = "gozosos" | "luminosos" | "dolorosos" | "gloriosos";

interface Step {
  beadId: string | null;
  title: string;
  subtitle?: string;
  text: string;
  isMystery?: boolean;
  isEnd?: boolean;
}

interface BeadDef {
  id: string;
  x: number;
  y: number;
  r: number;
  isLarge: boolean;
}

interface SavedProgress {
  mysteryKey: MysteryKey;
  currentStep: number;
  savedAt: number;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "terco-progress";
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48h

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProgress;
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveProgress(mysteryKey: MysteryKey, currentStep: number) {
  try {
    const data: SavedProgress = {
      mysteryKey,
      currentStep,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ─── Mystery styles (UI-only) ────────────────────────────────────────────────

interface MysteryStyle {
  accent: string;
  accentDim: string;
  accentClass: string;
}

const MYSTERY_STYLES: Record<MysteryKey, MysteryStyle> = {
  gozosos: {
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.18)",
    accentClass: "text-amber-500 dark:text-amber-400",
  },
  luminosos: {
    accent: "#38bdf8",
    accentDim: "rgba(56,189,248,0.18)",
    accentClass: "text-sky-500 dark:text-sky-400",
  },
  dolorosos: {
    accent: "#fb7185",
    accentDim: "rgba(251,113,133,0.18)",
    accentClass: "text-rose-500 dark:text-rose-400",
  },
  gloriosos: {
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.18)",
    accentClass: "text-violet-500 dark:text-violet-400",
  },
};

// ─── Step Builder ────────────────────────────────────────────────────────────

function buildSteps(key: MysteryKey): Step[] {
  const { prayers, pendantIntentions, mysteries } = tercoData;
  const m = mysteries[key];
  const steps: Step[] = [];

  steps.push({
    beadId: "cross",
    title: "Sinal da Cruz · Credo",
    subtitle: "No crucifixo",
    text: `${prayers.sinalDaCruz}\n\n${prayers.oferecimento}\n\n${prayers.credo}`,
  });
  steps.push({
    beadId: "p_large",
    title: "Pai Nosso",
    subtitle: "1ª conta grande",
    text: prayers.paiNosso,
  });

  for (let i = 0; i < 3; i++) {
    steps.push({
      beadId: `p_small_${i + 1}`,
      title: "Ave Maria",
      subtitle: pendantIntentions[i],
      text: prayers.aveMaria,
    });
  }

  // Gloria vem depois das 3 Ave Marias, antes do 1º Pai Nosso — sem conta específica
  steps.push({
    beadId: null,
    title: "Glória ao Pai",
    subtitle: "Após as 3 Ave Marias",
    text: prayers.gloria,
  });

  for (let d = 0; d < 5; d++) {
    steps.push({
      beadId: null,
      title: `${d + 1}º Mistério`,
      subtitle: m.name,
      text: m.list[d],
      isMystery: true,
    });
    steps.push({
      beadId: `d${d + 1}_large`,
      title: "Pai Nosso",
      subtitle: `${d + 1}ª década`,
      text: prayers.paiNosso,
    });
    for (let i = 0; i < 10; i++) {
      steps.push({
        beadId: `d${d + 1}_s${i + 1}`,
        title: "Ave Maria",
        subtitle: `${i + 1}ª de 10 · ${d + 1}ª década`,
        text: prayers.aveMaria,
      });
    }
    steps.push({
      beadId: null,
      title: "Glória ao Pai · Oração de Fátima",
      subtitle: `Após a ${d + 1}ª década`,
      text: `${prayers.gloria}\n\n${prayers.fatima}`,
    });
  }

  steps.push({
    beadId: "center",
    title: "Salve Rainha",
    subtitle: "Oração final",
    text: prayers.salveRainha,
  });
  steps.push({
    beadId: null,
    title: "Terço concluído",
    subtitle: "Louvado seja Nosso Senhor Jesus Cristo!",
    text: "Que a intercessão de Nossa Senhora vos acompanhe e proteja.\n\nEm nome do Pai, do Filho e do Espírito Santo. Amém.",
    isEnd: true,
  });

  return steps;
}

// ─── SVG Geometry ────────────────────────────────────────────────────────────

const SVG_W = 400;
const SVG_H = 500;
const CX = 200;
const CY = 175;
// Oval vertical: RY >> RX
const RX = 95;
const RY = 148;
const LOOP_BOTTOM_Y = CY + RY; // 323

// d1_large foi movido do loop para o pendant (fica abaixo da medalha central, na linha do crucifixo)
// Loop tem 54 contas: d1_s1..d1_s10 + décadas 2-5 completas (4 × 11)
const LOOP_COUNT = 54;
const GAP_DEG = 10;
// Gap centrado em 180° → d2_large e d5_large ficam simétricas na horizontal (mesmo y)
const LOOP_START = 180 + GAP_DEG / 2; // = 185
const LOOP_STEP = (360 - GAP_DEG) / LOOP_COUNT; // ≈ 6.481°

function deg2xy(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + RX * Math.sin(rad), y: CY - RY * Math.cos(rad) };
}

const LOOP_BEADS: BeadDef[] = Array.from({ length: LOOP_COUNT }, (_, i) => {
  const { x, y } = deg2xy(LOOP_START + (i + 0.5) * LOOP_STEP);
  let id: string;
  let isLarge: boolean;
  if (i < 10) {
    // Década 1: só as 10 Ave Marias — Pai Nosso (d1_large) está no pendant
    id = `d1_s${i + 1}`;
    isLarge = false;
  } else {
    const adj = i - 10;
    const d = Math.floor(adj / 11) + 2;
    const p = adj % 11;
    isLarge = p === 0;
    id = isLarge ? `d${d}_large` : `d${d}_s${p}`;
  }
  return { id, x, y, r: isLarge ? 8.5 : 5.5, isLarge };
});

// Pendant (de cima para baixo): center → d1_large → p_small_3/2/1 → p_large → cruz
// Reza-se de baixo para cima: cruz → p_large → p_small_1/2/3 → center → d1_large → [loop]
// Gap uniforme ~4px entre todas as contas
const PENDANT_BEADS: BeadDef[] = [
  { id: "center", x: CX, y: LOOP_BOTTOM_Y + 14, r: 10, isLarge: true },
  { id: "d1_large", x: CX, y: LOOP_BOTTOM_Y + 37, r: 8.5, isLarge: true }, // 22.5px c-t-c (4.5px gap)
  { id: "p_small_3", x: CX, y: LOOP_BOTTOM_Y + 55, r: 5.5, isLarge: false }, // 18px c-t-c (4px gap)
  { id: "p_small_2", x: CX, y: LOOP_BOTTOM_Y + 70, r: 5.5, isLarge: false }, // 15px c-t-c
  { id: "p_small_1", x: CX, y: LOOP_BOTTOM_Y + 85, r: 5.5, isLarge: false },
  { id: "p_large", x: CX, y: LOOP_BOTTOM_Y + 103, r: 8.5, isLarge: true }, // 18px c-t-c
];
const CROSS_CY = LOOP_BOTTOM_Y + 135; // 31.5px c-t-c desde p_large (4px gap)

// ─── SVG Bead ────────────────────────────────────────────────────────────────

function BeadCircle({
  bead,
  isActive,
  isVisited,
  onClick,
}: {
  bead: BeadDef;
  isActive: boolean;
  isVisited: boolean;
  onClick: () => void;
}) {
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <circle
        cx={bead.x}
        cy={bead.y}
        r={Math.max(bead.r + 8, 14)}
        fill="transparent"
      />
      {isActive && (
        <circle
          cx={bead.x}
          cy={bead.y}
          r={bead.r + 6}
          fill="var(--accent-dim)"
        />
      )}
      <circle
        cx={bead.x}
        cy={bead.y}
        r={bead.r}
        style={isActive ? { fill: "var(--accent)" } : undefined}
        className={
          isActive
            ? undefined
            : isVisited
              ? "fill-zinc-400 dark:fill-zinc-500"
              : bead.isLarge
                ? "fill-zinc-300 dark:fill-zinc-600"
                : "fill-zinc-200 dark:fill-zinc-700"
        }
      />
      {bead.isLarge && (
        <circle
          cx={bead.x - bead.r * 0.3}
          cy={bead.y - bead.r * 0.3}
          r={bead.r * 0.22}
          fill="white"
          opacity={isActive ? 0.5 : 0.3}
        />
      )}
    </g>
  );
}

function CrossShape({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  const cx = CX,
    cy = CROSS_CY;
  const vH = 38,
    vW = 6,
    hW = 28,
    hH = 6;
  const topY = cy - vH / 2;
  const barY = topY + 11;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <rect
        x={cx - 20}
        y={topY - 8}
        width={40}
        height={vH + 16}
        rx={4}
        fill="transparent"
      />
      {isActive && (
        <rect
          x={cx - hW / 2 - 5}
          y={topY - 5}
          width={hW + 10}
          height={vH + 10}
          rx={8}
          fill="var(--accent-dim)"
        />
      )}
      <rect
        x={cx - vW / 2}
        y={topY}
        width={vW}
        height={vH}
        rx={vW / 2}
        style={isActive ? { fill: "var(--accent)" } : undefined}
        className={isActive ? undefined : "fill-zinc-400 dark:fill-zinc-500"}
      />
      <rect
        x={cx - hW / 2}
        y={barY}
        width={hW}
        height={hH}
        rx={hH / 2}
        style={isActive ? { fill: "var(--accent)" } : undefined}
        className={isActive ? undefined : "fill-zinc-400 dark:fill-zinc-500"}
      />
    </g>
  );
}

// ─── Rosary SVG ──────────────────────────────────────────────────────────────

function RosarySVG({
  activeBeadId,
  visitedBeadIds,
  mysteryKey,
  onBeadTap,
}: {
  activeBeadId: string | null;
  visitedBeadIds: Set<string>;
  mysteryKey: MysteryKey;
  onBeadTap: (id: string) => void;
}) {
  const s = MYSTERY_STYLES[mysteryKey];
  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-full"
      style={
        {
          "--accent": s.accent,
          "--accent-dim": s.accentDim,
        } as React.CSSProperties
      }
    >
      {/* chain: loop segments */}
      {LOOP_BEADS.map((bead, i) => {
        if (i === LOOP_COUNT - 1) return null;
        const next = LOOP_BEADS[i + 1];
        return (
          <line
            key={`ll-${i}`}
            x1={bead.x}
            y1={bead.y}
            x2={next.x}
            y2={next.y}
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth={1.5}
          />
        );
      })}

      {/* loop ends → center medal (top of pendant) */}
      <line
        x1={LOOP_BEADS[0].x}
        y1={LOOP_BEADS[0].y}
        x2={CX}
        y2={LOOP_BOTTOM_Y + 14}
        className="stroke-zinc-200 dark:stroke-zinc-700"
        strokeWidth={1.5}
      />
      <line
        x1={LOOP_BEADS[LOOP_COUNT - 1].x}
        y1={LOOP_BEADS[LOOP_COUNT - 1].y}
        x2={CX}
        y2={LOOP_BOTTOM_Y + 14}
        className="stroke-zinc-200 dark:stroke-zinc-700"
        strokeWidth={1.5}
      />

      {/* pendant chain: center → d1_large → p_smalls → p_large → cross */}
      <line
        x1={CX}
        y1={LOOP_BOTTOM_Y + 14}
        x2={CX}
        y2={CROSS_CY - 20}
        className="stroke-zinc-200 dark:stroke-zinc-700"
        strokeWidth={1.5}
      />

      {/* beads */}
      {LOOP_BEADS.map((b) => (
        <BeadCircle
          key={b.id}
          bead={b}
          isActive={b.id === activeBeadId}
          isVisited={visitedBeadIds.has(b.id)}
          onClick={() => onBeadTap(b.id)}
        />
      ))}
      {PENDANT_BEADS.map((b) => (
        <BeadCircle
          key={b.id}
          bead={b}
          isActive={b.id === activeBeadId}
          isVisited={visitedBeadIds.has(b.id)}
          onClick={() => onBeadTap(b.id)}
        />
      ))}
      <CrossShape
        isActive={activeBeadId === "cross"}
        onClick={() => onBeadTap("cross")}
      />

      {/* label "1" junto ao d1_large no pendant — indica a 1ª década */}
      <text
        x={CX + 20}
        y={LOOP_BOTTOM_Y + 37}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={8}
        fontWeight={700}
        fontFamily="var(--font-inter), system-ui, sans-serif"
        className="fill-zinc-400 dark:fill-zinc-500"
        style={{ pointerEvents: "none" }}
      >
        1
      </text>

      {/* labels discretos nas décadas 2-5 (d1_large está no pendant, sem label no loop) */}
      {([10, 21, 32, 43] as const).map((loopIdx, i) => {
        const decade = i + 2; // décadas 2, 3, 4, 5
        const angleDeg = LOOP_START + (loopIdx + 0.5) * LOOP_STEP;
        const rad = (angleDeg * Math.PI) / 180;
        return (
          <text
            key={`lbl-${decade}`}
            x={CX + (RX + 18) * Math.sin(rad)}
            y={CY - (RY + 14) * Math.cos(rad)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fontFamily="var(--font-inter), system-ui, sans-serif"
            fontWeight={700}
            className="fill-zinc-300 dark:fill-zinc-600"
            style={{ pointerEvents: "none" }}
          >
            {decade}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Mystery Selector ────────────────────────────────────────────────────────

function todaysMystery(): MysteryKey {
  const map: Record<number, MysteryKey> = {
    0: "gloriosos",
    1: "gozosos",
    2: "dolorosos",
    3: "gloriosos",
    4: "luminosos",
    5: "dolorosos",
    6: "gozosos",
  };
  return map[new Date().getDay()];
}

const TOTAL_STEPS = buildSteps("gozosos").length;

function MysterySelector({
  onSelect,
  savedProgress,
  onContinue,
}: {
  onSelect: (key: MysteryKey) => void;
  savedProgress: SavedProgress | null;
  onContinue: () => void;
}) {
  const today = todaysMystery();
  const keys = Object.keys(tercoData.mysteries) as MysteryKey[];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <header className="max-w-2xl mx-auto w-full px-5 pt-5 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="size-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="flex-1">
          <h1 className="text-[20px] font-bold font-sans leading-tight tracking-tight">
            Terço Sagrado
          </h1>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans leading-none mt-0.5">
            Escolha os mistérios
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-xl mx-auto px-4 pb-20 pt-2">
        {/* continuar banner */}
        {savedProgress && (
          <div className="mb-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[14px] font-sans text-zinc-900 dark:text-zinc-100">
                Continuar terço
              </p>
              <p className="text-[12px] font-sans text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {tercoData.mysteries[savedProgress.mysteryKey].name} · passo{" "}
                {savedProgress.currentStep + 1} de {TOTAL_STEPS}
              </p>
            </div>
            <button
              onClick={onContinue}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-sans font-semibold text-[13px] active:scale-95 transition-all"
            >
              Continuar
            </button>
          </div>
        )}

        {/* today chip */}
        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-[11px] font-semibold font-sans text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Hoje
          </span>
          <button
            onClick={() => onSelect(today)}
            className={`px-3 py-1 rounded-full text-[12px] font-semibold font-sans transition-all active:scale-95 ${MYSTERY_STYLES[today].accentClass} bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700`}
          >
            {tercoData.mysteries[today].name}
          </button>
        </div>

        {/* mystery cards - fundo neutro, accent só no título */}
        <div className="flex flex-col gap-2.5">
          {keys.map((key) => {
            const m = tercoData.mysteries[key];
            const s = MYSTERY_STYLES[key];
            const isToday = key === today;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className="w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all duration-150 active:scale-[0.98] hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`font-semibold text-[15px] font-sans ${s.accentClass}`}
                    >
                      {m.name}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-sans mt-0.5">
                      {m.subtitle}
                    </p>
                  </div>
                  {isToday && (
                    <span
                      className={`flex-shrink-0 text-[10px] font-bold font-sans uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 ${s.accentClass}`}
                    >
                      Hoje
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  {m.list.map((item, i) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span
                        className="flex-shrink-0 w-3.5 text-[10px] font-bold font-sans opacity-40"
                        style={{ color: s.accent }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[12px] font-sans text-zinc-500 dark:text-zinc-400 leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[11px] font-sans text-zinc-400 dark:text-zinc-500">
                  {m.days}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 px-1">
          <p className="text-[11px] font-semibold font-sans text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
            Estrutura
          </p>
          <div className="space-y-2 text-[13px] font-sans text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <p>✦ Sinal da Cruz + Credo (crucifixo)</p>
            <p>✦ Pai Nosso + 3 Ave Marias (pela Fé, Esperança e Caridade)</p>
            <p>
              ✦ 5 décadas: mistério · Pai Nosso · 10 Ave Marias · Glória +
              Fátima
            </p>
            <p>✦ Salve Rainha</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Prayer Guide ────────────────────────────────────────────────────────────

function PrayerGuide({
  mysteryKey,
  steps,
  currentStep,
  onNext,
  onPrev,
  onJump,
  onReset,
}: {
  mysteryKey: MysteryKey;
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onJump: (i: number) => void;
  onReset: () => void;
}) {
  const step = steps[currentStep];
  const s = MYSTERY_STYLES[mysteryKey];
  const m = tercoData.mysteries[mysteryKey];
  const textRef = useRef<HTMLDivElement>(null);
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = currentStep / (steps.length - 1);

  useEffect(() => {
    textRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext, onPrev]);

  const visitedBeadIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < currentStep; i++) {
      const bid = steps[i].beadId;
      if (bid) ids.add(bid);
    }
    return ids;
  }, [steps, currentStep]);

  const handleBeadTap = useCallback(
    (beadId: string) => {
      let idx = steps.findIndex(
        (step, i) => step.beadId === beadId && i >= currentStep,
      );
      if (idx === -1)
        idx = steps.reduce(
          (last, step, i) => (step.beadId === beadId ? i : last),
          -1,
        );
      if (idx !== -1) onJump(idx);
    },
    [steps, currentStep, onJump],
  );

  return (
    <div className="h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="flex-shrink-0 px-5 pt-5 pb-2 flex items-center gap-3">
          <button
            onClick={onReset}
            className="size-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-semibold font-sans leading-tight tracking-tight">
              Terço Sagrado
            </h1>
            <p
              className={`text-[11px] font-sans leading-none mt-0.5 truncate ${s.accentClass}`}
            >
              {m.name}
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-shrink-0 h-0.5 mx-5 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%`, backgroundColor: s.accent }}
          />
        </div>

        <div
          className="flex-shrink-0 px-4 pt-1 pb-1"
          style={{ height: "44svh" }}
        >
          <RosarySVG
            activeBeadId={step.beadId}
            visitedBeadIds={visitedBeadIds}
            mysteryKey={mysteryKey}
            onBeadTap={handleBeadTap}
          />
        </div>

        <div className="flex-shrink-0 h-px mx-5 bg-zinc-100 dark:bg-zinc-800" />

        <div className="flex-1 overflow-hidden flex flex-col px-5 pt-4 pb-1 min-h-0">
          {step.subtitle && (
            <p
              className={`flex-shrink-0 text-[11px] font-semibold font-sans uppercase tracking-widest mb-1.5 ${s.accentClass}`}
            >
              {step.subtitle}
            </p>
          )}
          <h2
            className={`flex-shrink-0 text-[22px] font-bold font-sans tracking-tight leading-tight mb-3 ${step.isEnd ? s.accentClass : ""}`}
          >
            {step.title}
          </h2>

          <div ref={textRef} className="flex-1 overflow-y-auto min-h-0">
            {step.isMystery ? (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                <p className="font-serif text-[18px] leading-relaxed text-zinc-800 dark:text-zinc-100">
                  {step.text}
                </p>
                <p className="mt-3 text-[12px] font-sans text-zinc-400 dark:text-zinc-500">
                  Medite sobre este mistério ao rezar a década
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {step.text.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="font-serif text-[16px] leading-[1.75] text-zinc-700 dark:text-zinc-300"
                  >
                    {para}
                  </p>
                ))}
              </div>
            )}
            <div className="h-2" />
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pt-2 pb-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className={`flex items-center gap-1 px-4 py-3 rounded-2xl font-sans font-medium text-[14px] transition-all duration-150 active:scale-[0.97] ${isFirst ? "opacity-30 pointer-events-none bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              Anterior
            </button>
            <div className="flex-1 text-center">
              <span className="text-[12px] font-sans tabular-nums text-zinc-400 dark:text-zinc-500">
                {currentStep + 1}
                <span className="mx-0.5 opacity-50">/</span>
                {steps.length}
              </span>
            </div>
            {isLast ? (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-5 py-3 rounded-2xl font-sans font-medium text-[14px] text-white transition-all duration-150 active:scale-[0.97]"
                style={{ backgroundColor: s.accent }}
              >
                <RotateCcw size={15} strokeWidth={2.5} /> Recomeçar
              </button>
            ) : (
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-5 py-3 rounded-2xl font-sans font-medium text-[14px] text-white transition-all duration-150 active:scale-[0.97]"
                style={{ backgroundColor: s.accent }}
              >
                Próximo <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TercoPage() {
  const [mysteryKey, setMysteryKey] = useState<MysteryKey | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(
    null,
  );

  const steps = useMemo(
    () => (mysteryKey ? buildSteps(mysteryKey) : []),
    [mysteryKey],
  );

  // Carregar progresso guardado no mount
  useEffect(() => {
    setSavedProgress(loadProgress());
  }, []);

  // Guardar/limpar progresso sempre que avança
  useEffect(() => {
    if (!mysteryKey || steps.length === 0) return;
    if (currentStep >= steps.length - 1) {
      clearProgress();
    } else if (currentStep > 0) {
      saveProgress(mysteryKey, currentStep);
    }
  }, [mysteryKey, currentStep, steps.length]);

  const handleSelect = (key: MysteryKey) => {
    clearProgress();
    setMysteryKey(key);
    setCurrentStep(0);
  };

  const handleContinue = () => {
    if (!savedProgress) return;
    setMysteryKey(savedProgress.mysteryKey);
    setCurrentStep(savedProgress.currentStep);
    setSavedProgress(null);
  };

  const handleReset = () => {
    setMysteryKey(null);
    setCurrentStep(0);
    setSavedProgress(loadProgress());
  };

  if (!mysteryKey) {
    return (
      <MysterySelector
        onSelect={handleSelect}
        savedProgress={savedProgress}
        onContinue={handleContinue}
      />
    );
  }

  return (
    <PrayerGuide
      mysteryKey={mysteryKey}
      steps={steps}
      currentStep={currentStep}
      onNext={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
      onPrev={() => setCurrentStep((s) => Math.max(s - 1, 0))}
      onJump={(i) => setCurrentStep(i)}
      onReset={handleReset}
    />
  );
}
