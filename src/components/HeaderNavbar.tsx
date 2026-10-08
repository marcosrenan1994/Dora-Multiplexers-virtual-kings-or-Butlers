import React from "react";
import {
  Share2,
  Volume2,
  VolumeX,
  Radio,
  Play,
  Square,
  Sparkles,
  Bot,
  Layers,
} from "lucide-react";

interface HeaderNavbarProps {
  currentMode: "interactive" | "debate";
  onModeChange: (mode: "interactive" | "debate") => void;
  isDebating: boolean;
  onToggleDebate: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeDotsCount: number;
  totalSolutionsCount: number;
  onOpenNewDotModal: () => void;
  onSelectPresetTopic: (topic: string) => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentMode,
  onModeChange,
  isDebating,
  onToggleDebate,
  isMuted,
  onToggleMute,
  activeDotsCount,
  totalSolutionsCount,
  onOpenNewDotModal,
  onSelectPresetTopic,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d19]/90 px-4 md:px-6 flex items-center justify-between z-30 backdrop-blur-xl shrink-0">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
          <Share2 className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Space_Grotesk'] font-bold text-base md:text-lg tracking-wide text-white">
              DOT-NEXUS
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-md font-semibold">
              Live Multiplexer Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            IAs Autônomas Proativas & Protocolo de Solução da Humanidade
          </p>
        </div>
      </div>

      {/* Center Mode Controls & Debate Trigger */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mode Toggle */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs font-medium">
          <button
            onClick={() => onModeChange("interactive")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              currentMode === "interactive"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-md shadow-blue-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Voz & Roteamento</span>
            <span className="md:hidden">Roteamento</span>
          </button>
          <button
            onClick={() => onModeChange("debate")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              currentMode === "debate"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-purple-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Mesa-Redonda</span>
            <span className="md:hidden">Debate</span>
          </button>
        </div>

        {/* Start/Stop Debate Quick Action */}
        <button
          onClick={onToggleDebate}
          className={`px-3 py-1.5 md:px-4 md:py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md ${
            isDebating
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 animate-pulse"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20"
          }`}
          title={isDebating ? "Pausar debate autônomo" : "Iniciar debate proativo entre os Dots"}
        >
          {isDebating ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pausar Debate</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Iniciar Debate</span>
            </>
          )}
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Audio Mute toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-all ${
            isMuted
              ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          }`}
          title={isMuted ? "Ativar síntese de voz TTS" : "Silenciar voz"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Live Status indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium">
            {activeDotsCount} Dots Online
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-medium">
            {totalSolutionsCount} Soluções
          </span>
        </div>

        {/* Add Dot Button */}
        <button
          onClick={onOpenNewDotModal}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">+ Novo Dot</span>
        </button>
      </div>
    </header>
  );
};
