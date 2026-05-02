import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-6 text-center font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="w-16 h-16 rounded-[1.25rem] mb-6 flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <BookOpen
          size={28}
          strokeWidth={1.6}
          className="text-zinc-800 dark:text-zinc-200"
        />
      </div>

      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">
        Erro 404
      </p>

      <h1 className="text-zinc-900 dark:text-white text-3xl md:text-4xl font-bold mb-3 font-serif tracking-tight">
        Página não encontrada
      </h1>

      <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mb-10 leading-relaxed">
        O versículo ou livro que você procura não existe ou foi movido para
        outra parte das Escrituras.
      </p>

      <Link
        href="/"
        className="
          inline-flex items-center gap-2
          px-6 py-3 rounded-full
          bg-zinc-900 dark:bg-white
          text-white dark:text-zinc-900
          text-[15px] font-semibold
          hover:bg-zinc-800 dark:hover:bg-zinc-100
          active:scale-95
          shadow-sm
          transition-all duration-150
        "
      >
        <ArrowLeft size={18} strokeWidth={1.5} />
        Ir para a Bíblia
      </Link>
    </div>
  );
}
