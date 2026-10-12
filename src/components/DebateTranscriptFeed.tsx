import React, { useRef, useEffect } from "react";
import { ChatMessage, DotAgent } from "../types";
import {
  Volume2,
  Trash2,
  Bot,
  User,
  Share2,
  Sparkles,
  Radio,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

interface DebateTranscriptFeedProps {
  messages: ChatMessage[];
  onClearMessages: () => void;
  onPlayMessageVoice: (message: ChatMessage) => void;
  dots: DotAgent[];
  activeSpeakingMessageId: string | null;
}

export const DebateTranscriptFeed: React.FC<DebateTranscriptFeedProps> = ({
  messages,
  onClearMessages,
  onPlayMessageVoice,
  dots,
  activeSpeakingMessageId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const getDot = (dotId?: string) => {
    return dots.find((d) => d.id === dotId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a14]/60">
      {/* Header bar */}
      <div className="px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0 bg-slate-950/40">
        <div className="flex items-center gap-2 font-mono">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">
            FLUXO DO MULTIPLEXADOR & DIÁLOGO DE CONCEPÇÃO
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] text-slate-500">
            {messages.length} eventos registrados
          </span>
        </div>

        <button
          onClick={onClearMessages}
          className="hover:text-rose-300 text-slate-500 transition-colors flex items-center gap-1.5 text-[11px]"
          title="Limpar mensagens"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpar</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <Share2 className="w-7 h-7" />
            </div>
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-300 mb-1">
              Mesa de Concepção Multimodal Ativa
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
              Fale através do microfone ou selecione um tópico abaixo para acionar o
              Multiplexador Neural e o debate cooperativo das IAs autônomas.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400/80 bg-cyan-500/5 px-3 py-1.5 rounded-lg border border-cyan-500/15">
              <span>Modo Gemini Live & Síntese de Voz Prontos</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.senderType === "user";
            const isRouter = msg.senderType === "router";
            const isSystem = msg.senderType === "system";
            const isMultiplexer = msg.senderType === "multiplexer";
            const isConsensus = msg.isConsensus && msg.consensus;
            const dot = getDot(msg.senderDotId);
            const isCurrentlySpeaking = activeSpeakingMessageId === msg.id;

            if (isConsensus && msg.consensus) {
              const c = msg.consensus;
              return (
                <div
                  key={msg.id}
                  className="mx-auto max-w-2xl w-full p-4 md:p-5 rounded-2xl bg-gradient-to-br from-[#0c1630] via-[#101e40] to-[#080d1d] border-2 border-amber-500/50 shadow-2xl shadow-amber-500/15 ring-1 ring-amber-400/30 animate-fade-in relative group"
                >
                  {/* Decorative glowing ambient orb */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                        Consenso Final do Nexus
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {c.feasibilityScore || 95}% Viabilidade
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {c.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Title of the consensus invention */}
                  <h3 className="font-['Space_Grotesk'] text-base md:text-lg font-bold text-white mb-2 tracking-wide text-amber-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{c.title}</span>
                  </h3>

                  {/* Short summary of what everyone devised */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs md:text-sm text-slate-100 leading-relaxed font-sans mb-3">
                    <span className="font-bold text-cyan-300 font-mono text-[11px] block mb-1 uppercase tracking-wider">
                      Resumo da Invenção Consensuada:
                    </span>
                    {c.shortSummary}
                  </div>

                  {/* Participating Dots & Audio Replay */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Invenção conjunta de:</span>
                      <span className="text-amber-300 font-semibold">
                        {c.participatingDots.join(", ")}
                      </span>
                    </div>

                    <button
                      onClick={() => onPlayMessageVoice(msg)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono transition-all ${
                        isCurrentlySpeaking
                          ? "bg-amber-500/30 text-amber-200 border border-amber-500/40 animate-pulse font-bold"
                          : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isCurrentlySpeaking ? "Ouvindo Consenso..." : "Ouvir Resumo do Consenso"}</span>
                    </button>
                  </div>
                </div>
              );
            }

            if (isRouter) {
              return (
                <div
                  key={msg.id}
                  className="mx-auto max-w-xl py-2 px-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300 flex items-center justify-between gap-3 shadow-md backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
                    <span className="truncate">
                      <strong>[Multiplexador]</strong> {msg.text}
                    </span>
                  </div>
                  {msg.reasoning && (
                    <span className="text-[10px] text-indigo-400/80 bg-indigo-500/20 px-2 py-0.5 rounded shrink-0">
                      Roteado
                    </span>
                  )}
                </div>
              );
            }

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="mx-auto max-w-lg py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300/90 text-center flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl animate-fade-in ${
                  isUser ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md ring-1 ring-white/10 ${
                    isMultiplexer
                      ? "bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 ring-cyan-400/50 shadow-cyan-500/30"
                      : ""
                  }`}
                  style={{
                    backgroundColor: isMultiplexer
                      ? undefined
                      : isUser
                      ? "#06b6d4"
                      : dot?.color || "#6366f1",
                  }}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : isMultiplexer ? (
                    <Share2 className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Body */}
                <div
                  className={`space-y-1 min-w-0 ${
                    isUser ? "items-end text-right" : ""
                  }`}
                >
                  {/* Sender Metadata Bar */}
                  <div
                    className={`flex items-center gap-2 ${
                      isUser ? "justify-end" : ""
                    }`}
                  >
                    <span className="font-['Space_Grotesk'] font-bold text-xs text-slate-200">
                      {msg.senderName}
                    </span>

                    {isMultiplexer && (
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.2 rounded font-semibold">
                        Orquestrador Pt-BR
                      </span>
                    )}

                    {dot && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 rounded">
                        {dot.topic}
                      </span>
                    )}

                    {msg.isProactiveChime && (
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Intervenção Proativa
                      </span>
                    )}

                    {msg.opinionTarget && (
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm shadow-amber-500/10">
                        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Opinião Enviada ao Nexus</span>
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-slate-500">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Content Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed text-slate-100 shadow-xl backdrop-blur-md relative group border ${
                      isUser
                        ? "bg-gradient-to-br from-cyan-600/90 to-blue-700/90 border-cyan-400/30 text-white rounded-tr-none"
                        : isCurrentlySpeaking
                        ? "bg-[#0f172a] border-cyan-400/60 ring-2 ring-cyan-400/30 rounded-tl-none shadow-cyan-500/10"
                        : "bg-[#0b1020]/90 border-slate-800 rounded-tl-none hover:border-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Audio Voice Replay Button */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <button
                          onClick={() => onPlayMessageVoice(msg)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono transition-all ${
                            isCurrentlySpeaking
                              ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 animate-pulse"
                              : "hover:bg-slate-800 hover:text-slate-200 text-slate-400"
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {isCurrentlySpeaking ? "Reproduzindo Voz..." : `Ouvir (${msg.voiceName || dot?.voice || "Zephyr"})`}
                          </span>
                        </button>

                        {dot && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Proat: {dot.proactivity}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
