"use client";

import { useState, useEffect } from "react";
import { DownloadCloud, Smartphone, Loader2 } from "lucide-react";
import { set, get } from "idb-keyval";

export function OfflineControls({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Verifica se já está rodando como app instalado (PWA nativo)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) {
      setIsStandalone(true);
    }

    // 2. Verifica se já baixou a Bíblia no banco offline
    get("biblia-offline").then((data) => {
      if (data) setIsSynced(true);
    });

    // 3. Captura o evento de instalação (só dispara se ainda não estiver instalado)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);

      if (!isSynced) {
        handleSync();
      }
    }
  };

  const handleSync = async () => {
    if (isSyncing || isSynced) return;
    setIsSyncing(true);

    try {
      const res = await fetch("/biblia-completa.json");
      const bibliaCompleta = await res.json();

      await set("biblia-offline", bibliaCompleta);

      setIsSynced(true);
    } catch (error) {
      console.error("Erro ao baixar a Bíblia:", error);
      alert("Ocorreu um erro. Verifique sua conexão.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isMounted) return <div className="w-9 h-9" />;

  const baseButtonClass = `
    w-9 h-9 flex items-center justify-center rounded-full relative
    text-zinc-500 dark:text-zinc-400
    hover:text-zinc-900 dark:hover:text-white
    hover:bg-black/[0.07] dark:hover:bg-white/10
    active:bg-black/[0.12] dark:active:bg-white/20
    transition-all duration-150 disabled:opacity-100 ${className}
  `;

  if ((isStandalone || !deferredPrompt) && isSynced) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Só exibe o celular se tiver o prompt de instalação e não estiver em modo standalone */}
      {!isStandalone && deferredPrompt && (
        <button
          onClick={handleInstall}
          title="Instalar App"
          className={baseButtonClass}
        >
          <Smartphone size={16} strokeWidth={1.8} />
        </button>
      )}

      {!isSynced && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          title="Baixar Bíblia Offline"
          className={baseButtonClass}
        >
          {isSyncing ? (
            <Loader2
              size={14}
              strokeWidth={2}
              className="animate-spin text-zinc-900 dark:text-white"
            />
          ) : (
            <DownloadCloud size={16} strokeWidth={1.8} />
          )}
        </button>
      )}
    </div>
  );
}
