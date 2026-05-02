"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Versiculo {
  versiculo: number;
  texto: string;
}

interface CapituloData {
  livro: string;
  slug: string;
  totalCapitulosLivro: number;
  capitulo: number;
  versiculos: Versiculo[];
}

function useChapterParams() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return {
    slug: parts[1] ?? "genesis",
    capitulo: Number(parts[2] ?? "1"),
  };
}

function VerseItem({ v }: { v: Versiculo }) {
  const [highlighted, setHighlighted] = useState(false);

  return (
    <p
      onClick={() => setHighlighted((h) => !h)}
      className={`
        mb-5 leading-[1.85] cursor-pointer rounded px-2 -mx-2 py-0.5
        transition-colors duration-200 select-none font-serif
        ${
          highlighted
            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100"
            : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
        }
      `}
    >
      <sup className="text-[11px] text-zinc-500 dark:text-zinc-400 mr-1.5 font-medium font-sans not-italic">
        {v.versiculo}
      </sup>
      {v.texto}
    </p>
  );
}

function VersesSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-zinc-200 dark:bg-zinc-800"
          style={{ width: `${55 + (i % 5) * 10}%` }}
        />
      ))}
    </div>
  );
}

export default function ChapterPage() {
  const router = useRouter();
  const { slug, capitulo } = useChapterParams();

  const [data, setData] = useState<CapituloData | null>(null);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalCapitulos = data?.totalCapitulosLivro ?? 1;
  const nomeLivro = data?.livro ?? "";

  const goChapter = useCallback(
    (n: number) => {
      if (n >= 1 && n <= totalCapitulos) router.push(`/biblia/${slug}/${n}`);
    },
    [router, slug, totalCapitulos],
  );

  useEffect(() => {
    setData(null);
    setError(false);
    scrollRef.current?.scrollTo(0, 0);

    fetch(`/api/biblia/${slug}/${capitulo}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [slug, capitulo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goChapter(capitulo - 1);
      if (e.key === "ArrowRight") goChapter(capitulo + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [capitulo, goChapter]);

  return (
    <div className="h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-7 pt-12 pb-32">
          <div className="text-center mb-12">
            {nomeLivro ? (
              <p className="text-zinc-500 dark:text-zinc-400 text-xs tracking-[0.2em] uppercase mb-3 font-sans">
                {nomeLivro}
              </p>
            ) : (
              <div className="h-3 w-24 mx-auto rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
            )}
            <h1
              className="font-bold text-zinc-900 dark:text-white leading-none font-serif"
              style={{ fontSize: "clamp(64px, 12vw, 96px)" }}
            >
              {capitulo}
            </h1>
          </div>

          {error && (
            <p className="text-center text-red-500 dark:text-red-400 font-sans">
              Erro ao carregar o capítulo.
            </p>
          )}

          {!data && !error && <VersesSkeleton />}

          {data && (
            <div className="text-[17px]">
              {data.versiculos.map((v) => (
                <VerseItem key={v.versiculo} v={v} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3
        backdrop-blur-[32px] backdrop-saturate-200 backdrop-brightness-[1.08]
        bg-gradient-to-b from-white/60 to-white/30 dark:from-white/[0.09] dark:to-white/[0.04]
        border-t border-black/[0.05] dark:border-white/[0.10]
        shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_-8px_32px_rgba(0,0,0,0.05)]
        dark:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_-8px_32px_rgba(0,0,0,0.55)]
        rounded-t-2xl mx-auto max-w-2xl z-50 transition-all duration-300"
      >
        <button
          onClick={() => goChapter(capitulo - 1)}
          disabled={capitulo <= 1}
          aria-label="Capítulo anterior"
          className="w-10 h-10 flex items-center justify-center rounded-full
            text-zinc-500 dark:text-zinc-400
            hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10
            active:bg-black/10 dark:active:bg-white/20
            disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <button
          onClick={() => router.push("/")}
          className="flex-1 text-center font-semibold text-[15px] text-zinc-800 dark:text-zinc-200 font-sans
            hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors duration-150"
        >
          {nomeLivro || "—"} {capitulo}
        </button>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <button
            onClick={() => goChapter(capitulo + 1)}
            disabled={capitulo >= totalCapitulos}
            aria-label="Próximo capítulo"
            className="w-10 h-10 flex items-center justify-center rounded-full
              text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10
              active:bg-black/10 dark:active:bg-white/20
              disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
