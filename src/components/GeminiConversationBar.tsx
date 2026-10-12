import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  ArrowUp,
  Sparkles,
  Radio,
  ChevronDown,
  Plus,
  Check,
  Cpu,
  Zap,
  Globe,
  Dna,
  TrendingUp,
  Sliders,
  Settings2,
  Share2,
  Layers,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { audioSpeechService } from "../services/audioSpeechService";
import { RealtimeAudioVisualizer } from "./RealtimeAudioVisualizer";
import { OrchestrationMode, ModelMode } from "../types";

interface GeminiConversationBarProps {
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  activeSpeakerDotName?: string | null;
  detectedTopic?: string | null;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
  orchestrationMode: OrchestrationMode;
  onChangeOrchestrationMode: (mode: OrchestrationMode) => void;
  modelMode: ModelMode;
  onChangeModelMode: (mode: ModelMode) => void;
  onSynthesizeSolution?: () => void;
  onUserActivity?: () => void;
}

export const GeminiConversationBar: React.FC<GeminiConversationBarProps> = ({
  onSendMessage,
  isProcessing,
  activeSpeakerDotName,
  detectedTopic,
  isLiveMode,
  onToggleLiveMode,
  orchestrationMode,
  onChangeOrchestrationMode,
  modelMode,
  onChangeModelMode,
  onSynthesizeSolution,
  onUserActivity,
}) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");

  // Dropdown states with arrows
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(e.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync mic recognition
  const handleToggleMic = () => {
    if (isRecording) {
      audioSpeechService.stopSpeechRecognition();
      setIsRecording(false);
      setSpeechInterim("");
    } else {
      setIsRecording(true);
      const started = audioSpeechService.startSpeechRecognition(
        (transcript, isFinal) => {
          setSpeechInterim(transcript);
          setInputText(transcript);
          if (isFinal && isLiveMode) {
            // In Live mode, auto-send when final sentence is detected
            setTimeout(() => {
              if (transcript.trim()) {
                onSendMessage(transcript.trim());
                setInputText("");
                setSpeechInterim("");
              }
            }, 600);
          }
        },
        (_error) => {
          setIsRecording(false);
          setSpeechInterim("");
        },
        () => {
          if (!isLiveMode) {
            setIsRecording(false);
            setSpeechInterim("");
          }
        },
        isLiveMode
      );

      if (!started) {
        // Speech recognition fallback simulation
        setIsRecording(true);
        setTimeout(() => {
          const samplePrompts = [
            "Multiplexer, avalie a melhor solução para erradicar emissões industriais de carbono.",
            "Como a fusão nuclear compacta pode ser distribuída em comunidades vulneráveis?",
            "Qual a perspectiva do Dot Superior sobre o financiamento de biotecnologia?",
            "Como sincronizar as IAs autônomas para resolver a fome mundial?",
          ];
          const chosen =
            samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
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
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (isRecording && !isLiveMode) {
        audioSpeechService.stopSpeechRecognition();
        setIsRecording(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    onUserActivity?.();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        120,
        textareaRef.current.scrollHeight
      )}px`;
    }
  };

  const modelLabels: Record<ModelMode, { name: string; tag: string }> = {
    "gemini-3.8-live": {
      name: "Gemini 3.8 Live + Multiplexer",
      tag: "Voz & Baixa Latência",
    },
    "gemini-3.1-pro": {
      name: "Gemini 3.1 Pro Thinking",
      tag: "Raciocínio Profundo",
    },
    "gemini-flash-lite": {
      name: "Gemini Flash Lite",
      tag: "Velocidade Extrema",
    },
  };

  const quickPillTopics = [
    {
      label: "Crise Climática & Biosferas",
      icon: <Globe className="w-3 h-3 text-emerald-400" />,
      prompt:
        "Multiplexer, elabore um plano unificado com a Dra. Gaia para sequestro maciço de carbono.",
    },
    {
      label: "Fusão Nuclear Hélio-3",
      icon: <Zap className="w-3 h-3 text-amber-400" />,
      prompt:
        "Dr. Prometheus e Multiplexer: como viabilizar micro-reatores de fusão comercialmente?",
    },
    {
      label: "Cura Genômica CRISPR",
      icon: <Dna className="w-3 h-3 text-cyan-400" />,
      prompt:
        "Multiplexer, convoque o Dr. Hippocrates para explicar edição epigenética contra senescência.",
    },
    {
      label: "Finanças Quânticas Dot Superior",
      icon: <TrendingUp className="w-3 h-3 text-blue-400" />,
      prompt:
        "Dot Superior: projete a liquidez necessária para financiar a matriz de energia limpa global.",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-4 pb-3 pt-1 flex flex-col items-center gap-2 relative z-30">
      {/* 1. Quick Topic Chips */}
      <div className="w-full flex items-center justify-start md:justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {quickPillTopics.map((topic, i) => (
          <button
            key={i}
            onClick={() => {
              setInputText(topic.prompt);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-all backdrop-blur-md"
          >
            {topic.icon}
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      {/* 2. REAL-TIME AUDIO VISUALIZER (Replaces static status indicator) */}
      <div className="w-full">
        <RealtimeAudioVisualizer
          activeSpeakerName={activeSpeakerDotName}
          detectedTopic={detectedTopic}
          isLiveMode={isLiveMode}
          isProcessing={isProcessing}
        />
      </div>

      {/* 3. GEMINI.COM STYLE CONVERSATION INPUT BAR */}
      <div className="w-full relative group">
        {/* Ambient Gradient Glow */}
        <div
          className={`absolute -inset-1 rounded-3xl transition-all duration-500 ${
            isLiveMode
              ? "bg-gradient-to-r from-cyan-500/40 via-blue-600/40 to-purple-600/40 blur-lg opacity-100 animate-pulse"
              : "bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-md opacity-60 group-hover:opacity-90"
          }`}
        ></div>

        <div className="relative flex flex-col bg-[#0b1022]/95 border border-slate-700/80 group-hover:border-slate-600/90 rounded-3xl shadow-2xl backdrop-blur-2xl transition-all p-2 md:p-2.5">
          {/* Top Options Bar (Model Picker + Tools dropdown with arrows) */}
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-800/60 mb-1">
            {/* Left: Model Selector with Arrow Menu */}
            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold">
                  {modelLabels[modelMode].name}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${
                    isModelMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Model Dropdown Menu */}
              {isModelMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl bg-[#0e1428] border border-slate-700/90 shadow-2xl p-1.5 z-50 text-xs font-sans animate-scale-in backdrop-blur-xl">
                  <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Modelos de Inteligência
                  </div>
                  {(
                    [
                      "gemini-3.8-live",
                      "gemini-3.1-pro",
                      "gemini-flash-lite",
                    ] as ModelMode[]
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        onChangeModelMode(m);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all ${
                        modelMode === m
                          ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <div>
                        <div className="text-xs">{modelLabels[m].name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {modelLabels[m].tag}
                        </div>
                      </div>
                      {modelMode === m && (
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Tools / Actions with Arrow Menu */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Opções</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${
                    isToolsMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Tools Dropdown Menu */}
              {isToolsMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-[#0e1428] border border-slate-700/90 shadow-2xl p-2 z-50 text-xs font-sans animate-scale-in backdrop-blur-xl space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Orquestração do Multiplexer
                  </div>

                  <button
                    onClick={() => {
                      onChangeOrchestrationMode(
                        orchestrationMode === "multiplexer_integrated"
                          ? "direct_specialist"
                          : "multiplexer_integrated"
                      );
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                      orchestrationMode === "multiplexer_integrated"
                        ? "bg-indigo-500/20 text-indigo-200"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        Resposta Integrada do Multiplexer
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        O Multiplexer responde diretamente em pt-BR sintetizando soluções.
                      </div>
                    </div>
                    {orchestrationMode === "multiplexer_integrated" && (
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
                    )}
                  </button>

                  {onSynthesizeSolution && (
                    <button
                      onClick={() => {
                        onSynthesizeSolution();
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-800 text-left transition-all"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">
                          Sintetizar Blueprint de Solução
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Forja um plano estruturado a partir da conversa.
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Input Textarea Row */}
          <div className="flex items-end gap-2 px-1 pt-1">
            {/* Quick Action Plus Button */}
            <button
              type="button"
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800/80 transition-all shrink-0 mb-0.5"
              title="Abrir menu de opções e orquestração"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Expanding Textarea Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isLiveMode
                  ? "Modo Live ativo: fale no microfone ou digite aqui..."
                  : isRecording
                  ? "Escutando sua voz em tempo real... fale agora..."
                  : "Pergunte ao Multiplexer ou proponha uma solução em português..."
              }
              className="flex-1 bg-transparent focus:outline-none text-xs md:text-sm text-slate-100 placeholder-slate-400 font-sans tracking-wide resize-none py-2 px-1 max-h-28 overflow-y-auto scrollbar-none"
              disabled={isProcessing}
            />

            {/* Right Action Icons: Live Button + Mic + Send */}
            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              {/* Gemini LIVE Mode Toggle Button */}
              <button
                type="button"
                onClick={onToggleLiveMode}
                className={`px-3 py-1.5 rounded-full font-['Space_Grotesk'] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isLiveMode
                    ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-cyan-500/40 ring-2 ring-cyan-400/50 animate-pulse"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-cyan-500/40"
                }`}
                title={
                  isLiveMode
                    ? "Desativar Modo Live"
                    : "Ativar Modo Live (Gemini Live contínuo)"
                }
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isLiveMode ? "text-amber-300 animate-spin-slow" : "text-cyan-400"
                  }`}
                />
                <span>Live</span>
                {isLiveMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </button>

              {/* Microphone Toggle Button */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                  isRecording
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80"
                }`}
                title={
                  isRecording ? "Desativar Microfone" : "Ativar Microfone"
                }
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Submit / Dispatch Arrow Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={
                  (!inputText.trim() && !speechInterim.trim()) || isProcessing
                }
                className={`p-2 rounded-full flex items-center justify-center transition-all ${
                  inputText.trim() || speechInterim.trim()
                    ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                }`}
                title="Enviar mensagem para o Multiplexer"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Subtle Caption Instruction */}
      <div className="text-[10.5px] text-slate-500 font-mono tracking-wide flex items-center gap-1.5 text-center">
        <span>Multiplexer Neural integrado em Português Brasileiro</span>
        <span>•</span>
        <span>Pressione Enter para enviar ou use o Modo Live com áudio</span>
      </div>
    </div>
  );
};
