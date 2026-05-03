"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Share2 } from "lucide-react";

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1436891620584-47fd0e565afb?q=80&w=2070&auto=format&fit=crop",
];

interface RandomVerse {
  texto: string;
  referencia: string;
}

export default function InspiracaoPage() {
  const [verse, setVerse] = useState<RandomVerse | null>(null);
  const [bgImage, setBgImage] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSharing, setIsSharing] = useState(false); // Feedback visual no botão

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRandomVerse = useCallback(async () => {
    setLoadingData(true);
    setImageLoaded(false);

    setBgImage(BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]);

    try {
      const resIndice = await fetch("/api/biblia");
      if (!resIndice.ok) throw new Error();
      const indice = await resIndice.json();

      const todosLivros = [
        ...indice.antigoTestamento,
        ...indice.novoTestamento,
      ];
      const livroSorteado =
        todosLivros[Math.floor(Math.random() * todosLivros.length)];

      const capituloSorteado =
        Math.floor(Math.random() * livroSorteado.totalCapitulos) + 1;

      const resCapitulo = await fetch(
        `/api/biblia/${livroSorteado.slug}/${capituloSorteado}`,
      );
      if (!resCapitulo.ok) throw new Error();
      const capituloData = await resCapitulo.json();

      const versiculos = capituloData.versiculos;
      const versiculoSorteado =
        versiculos[Math.floor(Math.random() * versiculos.length)];

      setVerse({
        texto: versiculoSorteado.texto,
        referencia: `${livroSorteado.nome} ${capituloSorteado}:${versiculoSorteado.versiculo}`,
      });
    } catch (error) {
      console.error("Erro ao sortear:", error);
      setVerse({
        texto: "O Senhor é o meu pastor; nada me faltará.",
        referencia: "Salmos 23:1",
      });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomVerse();
  }, [fetchRandomVerse]);

  const handleShare = async () => {
    if (!containerRef.current || !verse) return;
    setIsSharing(true);

    try {
      // Import dinâmico para não quebrar a compilação no servidor (Next.js SSR)
      const { toBlob } = await import("html-to-image");

      // Gera o blob da imagem (foto em alta qualidade)
      const blob = await toBlob(containerRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        // Ignora a div com id "action-buttons" para ela não sair no print
        filter: (node) => node.id !== "action-buttons",
      });

      if (!blob) throw new Error("Erro ao gerar imagem");

      // Transforma em arquivo compatível com a API de compartilhamento
      const file = new File([blob], "versiculo.png", { type: "image/png" });
      const shareData = {
        title: "Versículo do Dia",
        text: "Veja que mensagem inspiradora!",
        files: [file],
      };

      // Tenta abrir o menu nativo (Celular)
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: faz o download caso esteja num PC que não suporte "files" no Web Share
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `versiculo-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erro ao compartilhar a imagem", err);
      alert("Ops, não foi possível gerar a imagem no momento.");
    } finally {
      setIsSharing(false);
    }
  };

  const isFullyLoaded = !loadingData && imageLoaded;

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-zinc-950 selection:bg-white/30 text-white flex items-center justify-center"
    >
      {/* Imagem de Fundo c/ CORS Liberado para o Canvas */}
      {bgImage && (
        <img
          src={bgImage}
          alt="Paisagem de fundo"
          crossOrigin="anonymous" // OBRIGATÓRIO PARA O HTML-TO-IMAGE FUNCIONAR
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out transform ${
            imageLoaded
              ? "opacity-100 scale-100 blur-0"
              : "opacity-0 scale-105 blur-sm"
          }`}
        />
      )}

      {/* Overlay escuro */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: imageLoaded ? 1 : 0 }}
      />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 md:px-12 max-w-4xl mx-auto text-center">
        {!isFullyLoaded && (
          <div className="absolute inset-0  w-full px-6 z-0"></div>
        )}

        {/* Versículo */}
        <div
          className={`flex flex-col items-center transition-all duration-700 ease-out transform ${
            isFullyLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-white/40 mb-8"
          >
            <path d="M14.017 18L14.017 21L16.243 21C16.946 21 17.5 20.446 17.5 19.743L17.5 15.5C17.5 14.672 16.828 14 16 14L14 14L14 11C14 9.343 15.343 8 17 8L17 5C13.686 5 11 7.686 11 11L11 18L14.017 18ZM6.017 18L6.017 21L8.243 21C8.946 21 9.5 20.446 9.5 19.743L9.5 15.5C9.5 14.672 8.828 14 8 14L6 14L6 11C6 9.343 7.343 8 9 8L9 5C5.686 5 3 7.686 3 11L3 18L6.017 18Z" />
          </svg>

          <h1
            className="font-serif font-medium leading-[1.3] tracking-tight drop-shadow-xl text-balance"
            style={{ fontSize: "clamp(28px, 5vw, 56px)" }}
          >
            {verse?.texto}
          </h1>

          <p className="mt-8 font-sans text-sm md:text-base font-bold tracking-[0.15em] uppercase text-white/80 drop-shadow-md">
            {verse?.referencia}
          </p>
        </div>
      </div>

      {/* Controles: Isolados com ID para não saírem no "Print" */}
      <div
        id="action-buttons"
        className="absolute bottom-8 left-0 right-0 flex justify-center px-6 z-20"
      >
        <div
          className={`flex items-center gap-2 p-2 rounded-full
          backdrop-blur-[32px] backdrop-saturate-200
          bg-white/10 border border-white/20
          shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          transition-opacity duration-700 delay-300 ${
            isFullyLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={fetchRandomVerse}
            disabled={!isFullyLoaded || isSharing}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-sans font-medium text-sm
              hover:bg-white/10 active:bg-white/20 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <RefreshCw size={16} />
            Sortear
          </button>

          <div className="w-px h-8 bg-white/20 mx-1" />

          <button
            onClick={handleShare}
            disabled={!isFullyLoaded || isSharing}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-sans font-medium text-sm
              bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
          >
            {isSharing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Share2 size={16} />
                Compartilhar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
