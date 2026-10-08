import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  ArrowUp,
  Sparkles,
  Radio,
  Globe,
  Zap,
  Dna,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { audioSpeechService } from "../services/audioSpeechService";

interface GeminiConversationBarProps {
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  activeSpeakerDotName?: string | null;
  detectedTopic?: string | null;
}

export const GeminiConversationBar: React.FC<GeminiConversationBarProps> = ({
  onSendMessage,
  isProcessing,
  activeSpeakerDotName,
  detectedTopic,
}) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");
  const waveformIntervalRef = useRef<any>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>([15, 30, 60, 45, 80, 50, 20]);

  // Animated waveform effect when recording or speaking
  useEffect(() => {
    if (isRecording || activeSpeakerDotName) {
      waveformIntervalRef.current = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 7 }, () => Math.floor(Math.random() * 85) + 15)
        );
      }, 100);
    } else {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
      setWaveHeights([15, 25, 35, 25, 45, 20, 15]);
    }

    return () => {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    };
  }, [isRecording, activeSpeakerDotName]);

  const handleToggleMic = () => {
    if (isRecording) {
      audioSpeechService.stopSpeechRecognition();
      setIsRecording(false);
      setSpeechInterim("");
    } else {
      setIsRecording(true);
      const started = audioSpeechService.startSpeechRecognition(
        (transcript) => {
          setSpeechInterim(transcript);
          setInputText(transcript);
        },
        (_error) => {
          setIsRecording(false);
          setSpeechInterim("");
        },
        () => {
          setIsRecording(false);
          setSpeechInterim("");
        }
      );

      if (!started) {
        // Simulated speech fallback prompt for demo
        setIsRecording(true);
        setTimeout(() => {
          const samplePrompts = [
            "Como acelerar a fusão nuclear e garantir energia limpa global?",
            "Qual a viabilidade da cura genética universal contra pandemias?",
            "Como mitigar a crise climática sem colapsar a produção de alimentos?",
            "Como o Dot Superior pode alocar liquidez quantitativa para projetos de bioengenharia?",
          ];
          const chosen = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
          setInputText(chosen);
          setIsRecording(false);
        }, 2200);
      }
    }
  };

  const handleSend = () => {
    const textToSend = inputText.trim() || speechInterim.trim();
    if (textToSend && !isProcessing) {
      onSendMessage(textToSend);
      setInputText("");
      setSpeechInterim("");
      if (isRecording) {
        audioSpeechService.stopSpeechRecognition();
        setIsRecording(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPillTopics = [
    {
      label: "Crise Climática & Biosferas",
      icon: <Globe className="w-3 h-3 text-emerald-400" />,
      prompt: "Como regenerar ecossistemas e neutralizar carbono com bioengenharia autônoma?",
    },
    {
      label: "Fusão Nuclear Hélio-3",
      icon: <Zap className="w-3 h-3 text-amber-400" />,
      prompt: "Qual a melhor estratégia para micro-fusão nuclear descentralizada com custo zero?",
    },
    {
      label: "Cura Genômica CRISPR",
      icon: <Dna className="w-3 h-3 text-cyan-400" />,
      prompt: "Como aplicar edição genética in vivo para erradicar patologias e prolongar a vida saudável?",
    },
    {
      label: "Dot Superior: Finanças Quânticas",
      icon: <TrendingUp className="w-3 h-3 text-blue-400" />,
      prompt: "Como o algoritmo do Dot Superior pode financiar a infraestrutura de soluções globais?",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2 flex flex-col items-center gap-2 relative z-20">
      {/* Quick Topic Chips */}
      <div className="w-full flex items-center justify-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {quickPillTopics.map((topic, i) => (
          <button
            key={i}
            onClick={() => {
              setInputText(topic.prompt);
            }}
            className="shrink-0 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-all backdrop-blur-md"
          >
            {topic.icon}
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      {/* Live Speaker or Recording Status Pill */}
      {(isRecording || activeSpeakerDotName || detectedTopic) && (
        <div className="flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono shadow-lg backdrop-blur-md animate-fade-in">
          {isRecording ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-300 font-medium">Ouvindo voz em tempo real...</span>
            </>
          ) : activeSpeakerDotName ? (
            <>
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-medium">Voz Ativa: {activeSpeakerDotName}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-slate-300">Tópico Ativo: {detectedTopic}</span>
            </>
          )}

          {/* Sound wave bars */}
          <div className="flex items-center gap-0.5 h-3.5 pl-1.5 border-l border-slate-700">
            {waveHeights.map((h, idx) => (
              <span
                key={idx}
                className="w-0.5 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full transition-all duration-75"
                style={{ height: `${h}%` }}
              ></span>
            ))}
          </div>
        </div>
      )}

      {/* Main Gemini-Style Conversation Bar */}
      <div className="w-full relative group">
        {/* Glowing Gradient Border & Ambient Aura */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30 blur-md opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>

        <div className="relative flex items-center bg-[#0d1326]/95 border border-slate-700/80 group-hover:border-slate-500/90 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-2xl transition-all">
          {/* Microphone Action Pill */}
          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center mr-2 relative ${
              isRecording
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300"
            }`}
            title={isRecording ? "Desativar Microfone" : "Ativar Modo Voz (Gemini Live)"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Prompt Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Escutando sua voz... fale agora..."
                : "Converse com os Dots ou proponha um problema (ex: Crise Climática, Fusão Nuclear, Doenças)..."
            }
            className="w-full bg-transparent focus:outline-none text-xs md:text-sm text-slate-100 placeholder-slate-400/70 font-sans tracking-wide mr-3"
            disabled={isProcessing}
          />

          {/* Send / Dispatch Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !speechInterim.trim()) || isProcessing}
            className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() || speechInterim.trim()
                ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                : "bg-slate-800/60 text-slate-600 cursor-not-allowed"
            }`}
            title="Enviar para o Agente Multiplexador"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Subtle Caption Instruction */}
      <div className="text-[10px] text-slate-500 font-mono tracking-wide flex items-center gap-1.5">
        <span>Multiplexador Gemini v3.8</span>
        <span>•</span>
        <span>Roteamento autônomo baseado em semântica & proatividade</span>
      </div>
    </div>
  );
};
