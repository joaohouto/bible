"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Livro {
  nome: string;
  slug: string;
  totalCapitulos: number;
}

interface BibliaData {
  antigoTestamento: Livro[];
  novoTestamento: Livro[];
}

function ChapterGrid({
  total,
  slug,
  onSelect,
}: {
  total: number;
  slug: string;
  onSelect: (slug: string, n: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 px-1 pt-3 pb-4">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onSelect(slug, n)}
          className="
            rounded-xl py-2.5 text-sm font-medium font-sans
            bg-zinc-100 dark:bg-zinc-800/50
            text-zinc-700 dark:text-zinc-300
            hover:bg-zinc-200 dark:hover:bg-zinc-700
            hover:text-zinc-900 dark:hover:text-white
            active:scale-95
            border border-zinc-200/80 dark:border-zinc-700/50
            transition-all duration-150
          "
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function BookRow({
  livro,
  isOpen,
  onToggle,
  onSelectChapter,
  highlight,
}: {
  livro: Livro;
  isOpen: boolean;
  onToggle: () => void;
  onSelectChapter: (slug: string, n: number) => void;
  highlight?: string;
}) {
  // Highlight matching text in search
  const renderName = (text: string) => {
    if (!highlight) return text;

    const normalizeText = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const textNormalized = normalizeText(text);
    const highlightNormalized = normalizeText(highlight);

    const idx = textNormalized.indexOf(highlightNormalized);
    if (idx === -1) return text;

    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-400/30 text-amber-700 dark:text-amber-300 rounded-sm">
          {text.slice(idx, idx + highlight.length)}
        </mark>
        {text.slice(idx + highlight.length)}
      </>
    );
  };

  return (
    <div
      className={`
        rounded-2xl overflow-hidden border transition-all duration-200
        ${
          isOpen
            ? "bg-zinc-100/80 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600"
            : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        }
      `}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-medium text-[15px] text-zinc-900 dark:text-zinc-100 font-sans">
            {renderName(livro.nome)}
          </span>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`text-zinc-400 dark:text-zinc-500 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-3 mb-1">
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 mb-1" />
          <ChapterGrid
            total={livro.totalCapitulos}
            slug={livro.slug}
            onSelect={onSelectChapter}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  livros,
  openSlug,
  onToggle,
  onSelectChapter,
  searchQuery,
}: {
  title: string;
  livros: Livro[];
  openSlug: string | null;
  onToggle: (slug: string) => void;
  onSelectChapter: (slug: string, n: number) => void;
  searchQuery: string;
}) {
  if (livros.length === 0) return null;
  return (
    <section className="mb-8">
      <p className="text-[11px] font-semibold font-sans text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 px-1">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {livros.map((livro) => (
          <BookRow
            key={livro.slug}
            livro={livro}
            isOpen={openSlug === livro.slug}
            onToggle={() => onToggle(livro.slug)}
            onSelectChapter={onSelectChapter}
            highlight={searchQuery}
          />
        ))}
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-[54px] rounded-2xl bg-zinc-100 dark:bg-zinc-800/50"
        />
      ))}
    </div>
  );
}

export default function BibleIndex() {
  const router = useRouter();
  const [data, setData] = useState<BibliaData | null>(null);
  const [error, setError] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/biblia")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json: BibliaData) => setData(json))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 10);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // filter books by search query
  const filtered = useMemo(() => {
    if (!data) return null;
    if (!query.trim()) return data;

    const normalizeText = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const q = normalizeText(query);

    return {
      antigoTestamento: data.antigoTestamento.filter((l) =>
        normalizeText(l.nome).includes(q),
      ),
      novoTestamento: data.novoTestamento.filter((l) =>
        normalizeText(l.nome).includes(q),
      ),
    };
  }, [data, query]);

  // auto-open single result
  useEffect(() => {
    if (!filtered) return;
    const all = [...filtered.antigoTestamento, ...filtered.novoTestamento];
    if (all.length === 1) setOpenSlug(all[0].slug);
    else if (!query.trim()) setOpenSlug(null);
  }, [filtered, query]);

  const toggle = (slug: string) =>
    setOpenSlug((prev) => (prev === slug ? null : slug));

  const handleSelectChapter = (slug: string, n: number) =>
    router.push(`/biblia/${slug}/${n}`);

  const noResults =
    filtered &&
    filtered.antigoTestamento.length === 0 &&
    filtered.novoTestamento.length === 0;

  return (
    <div className="h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <header
        className={`max-w-2xl mx-auto w-full flex-shrink-0 relative z-20 transition-all duration-300 ease-in-out ${
          scrolled
            ? "bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        {/* top row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <BookOpen
                size={19}
                strokeWidth={1.6}
                className="text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight font-sans text-zinc-900 dark:text-white">
                Bíblia Sagrada
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5 font-sans">
                Versão Ave Maria
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* search bar */}
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-200 dark:focus-within:ring-zinc-800 transition-shadow">
            <Search
              size={14}
              strokeWidth={2}
              className="text-zinc-400 flex-shrink-0"
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar livro…"
              className="
                flex-1 bg-transparent text-[14px] font-sans
                text-zinc-900 dark:text-white
                placeholder:text-zinc-500
                outline-none border-none
              "
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 pt-4 pb-20">
          {error && (
            <p className="text-center text-red-500 dark:text-red-400 mt-10 font-sans">
              Erro ao carregar. Tente novamente.
            </p>
          )}

          {!data && !error && <Skeleton />}

          {noResults && (
            <div className="text-center mt-16">
              <p className="text-zinc-500 dark:text-zinc-400 font-sans text-[15px]">
                Nenhum livro encontrado para
              </p>
              <p className="text-zinc-800 dark:text-zinc-200 font-semibold font-sans mt-1">
                "{query}"
              </p>
            </div>
          )}

          {filtered && !noResults && (
            <>
              <Section
                title="Velho Testamento"
                livros={filtered.antigoTestamento}
                openSlug={openSlug}
                onToggle={toggle}
                onSelectChapter={handleSelectChapter}
                searchQuery={query}
              />
              <Section
                title="Novo Testamento"
                livros={filtered.novoTestamento}
                openSlug={openSlug}
                onToggle={toggle}
                onSelectChapter={handleSelectChapter}
                searchQuery={query}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
