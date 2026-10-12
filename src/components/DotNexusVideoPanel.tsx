import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Radio,
  Tv,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Film,
  X,
  Layers,
  ChevronRight,
  Bot,
  Zap,
  Sliders,
  CheckCircle2,
  Send,
  Users,
  Compass,
  FileText,
  Activity,
  Plus,
  PlayCircle,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Globe,
  Flame,
  LayoutGrid,
  Code,
  Video,
  Wand2
} from "lucide-react";
import {
  ChatMessage,
  HumanitySolution,
  VideoStoryboardScene,
  VideoFrame,
  DotAgent
} from "../types";
import { mediaCollageService, AutobotRadioSnippet } from "../services/mediaCollageService";
import { audioSpeechService } from "../services/audioSpeechService";

interface DotNexusVideoPanelProps {
  messages: ChatMessage[];
  solutions: HumanitySolution[];
  dots: DotAgent[];
  onToggleDotActive: (id: string) => void;
  onEditDot: (dot: DotAgent) => void;
  onOpenCreateModal: () => void;
  onDeleteDot: (id: string) => void;
  globalProactivity: number;
  onChangeGlobalProactivity: (val: number) => void;
  onSendMessage: (text: string) => Promise<void> | void;
  isProcessing: boolean;
  isDebating: boolean;
  onToggleDebate: () => void;
  onSynthesizeNewSolution: () => Promise<void> | void;
  isSynthesizing: boolean;
  onSelectPresetTopic: (topic: string) => void;
  selectedInitialMessage?: ChatMessage | null;
  onClearInitialMessage?: () => void;
  onToggleClassicMode?: () => void;
}

export const DotNexusVideoPanel: React.FC<DotNexusVideoPanelProps> = ({
  messages,
  solutions,
  dots,
  onToggleDotActive,
  onEditDot,
  onOpenCreateModal,
  onDeleteDot,
  globalProactivity,
  onChangeGlobalProactivity,
  onSendMessage,
  isProcessing,
  isDebating,
  onToggleDebate,
  onSynthesizeNewSolution,
  isSynthesizing,
  onSelectPresetTopic,
  selectedInitialMessage,
  onClearInitialMessage,
  onToggleClassicMode,
}) => {
  // Storyboard and Video playback states
  const [scenes, setScenes] = useState<VideoStoryboardScene[]>([]);
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackFps, setPlaybackFps] = useState<number>(2); // 1, 2, 4, 8 fps
  const [isAutobotRadioMode, setIsAutobotRadioMode] = useState<boolean>(true);
  const [isCrtGlitchActive, setIsCrtGlitchActive] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeSnippet, setActiveSnippet] = useState<AutobotRadioSnippet | null>(null);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(audioSpeechService.getIsMuted());

  // Drawer / Menu states inside Nexus (all menus delegated to Nexus!)
  const [activeNexusMenu, setActiveNexusMenu] = useState<
    "none" | "texts" | "dots" | "solutions" | "settings" | "generator"
  >("none");
  const [userPromptInput, setUserPromptInput] = useState<string>("");

  // Video Generator form state
  const [genObjectiveTitle, setGenObjectiveTitle] = useState<string>(
    "Enxame Quântico de 10 Bilhões de Especialistas para Todas as Profissões"
  );
  const [genObjectiveDesc, setGenObjectiveDesc] = useState<string>(
    "Plataforma universal desenvolvida por Dot 7 para Windows, Android e Supercomputadores Quânticos com Dot 8 coordenando a elevação e dignificação de todas as profissões da história humana em todo o planeta Terra."
  );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);

  const handleGenerateMissionVideo = (customTitle?: string, customDesc?: string) => {
    setIsGeneratingVideo(true);
    const title = customTitle || genObjectiveTitle;
    const desc = customDesc || genObjectiveDesc;

    const missionScene = mediaCollageService.generateCoherentMissionVideo(
      title,
      desc,
      dots.filter((d) => d.active)
    );

    setScenes((prev) => [missionScene, ...prev]);
    setCurrentSceneIdx(0);
    setCurrentFrameIdx(0);
    setActiveNexusMenu("none");
    setIsGeneratingVideo(false);

    // Auto-play the coherent mission scene
    setTimeout(() => {
      playSceneAudio(missionScene);
      setIsPlaying(true);
    }, 250);
  };

  // Refs for video container, canvas and animation loops
  const videoViewportRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioAnimationRef = useRef<number | null>(null);
  const frameIntervalRef = useRef<any>(null);
  const timecodeIntervalRef = useRef<any>(null);
  const [timecodeSeconds, setTimecodeSeconds] = useState<number>(0);

  // Build or update storyboard scenes from panel data
  useEffect(() => {
    const built = mediaCollageService.buildFullPanelStoryboard(messages, solutions, dots);
    setScenes(built);

    if (selectedInitialMessage) {
      const foundIdx = built.findIndex((s) => s.id === `scene-${selectedInitialMessage.id}`);
      if (foundIdx >= 0) {
        setCurrentSceneIdx(foundIdx);
        setCurrentFrameIdx(0);
      }
      onClearInitialMessage?.();
    }
  }, [messages, solutions, dots, selectedInitialMessage]);

  const currentScene: VideoStoryboardScene | undefined = scenes[currentSceneIdx] || scenes[0];
  const activeFrames: VideoFrame[] = currentScene?.frames || [];
  const currentFrame: VideoFrame | undefined = activeFrames[currentFrameIdx] || activeFrames[0];

  // Stop playback when unmounting
  useEffect(() => {
    return () => {
      audioSpeechService.stopAutobotRadio();
      if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (timecodeIntervalRef.current) clearInterval(timecodeIntervalRef.current);
    };
  }, []);

  // Multi-frame video animation engine: advances frames smoothly to form a video
  useEffect(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (isPlaying && activeFrames.length > 1) {
      const intervalMs = Math.round(1000 / playbackFps);
      frameIntervalRef.current = setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % activeFrames.length);
      }, intervalMs);
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isPlaying, playbackFps, activeFrames.length]);

  // Timecode ticker during playback
  useEffect(() => {
    if (isPlaying) {
      timecodeIntervalRef.current = setInterval(() => {
        setTimecodeSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timecodeIntervalRef.current) clearInterval(timecodeIntervalRef.current);
    }
    return () => {
      if (timecodeIntervalRef.current) clearInterval(timecodeIntervalRef.current);
    };
  }, [isPlaying]);

  // Audio spectrum visualizer responding to Autobot Radio
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const render = () => {
      if (!running) return;

      const visualState = audioSpeechService.getVisualizerData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barCount = 32;
      const barWidth = width / barCount - 2;
      const freq = visualState.frequencyData;

      for (let i = 0; i < barCount; i++) {
        const value = freq && freq.length > 0 ? freq[i % freq.length] : isPlaying ? 35 + (i % 5) * 8 : 12;
        const barHeight = Math.max(3, (value / 255) * height);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "rgba(6, 182, 212, 0.4)");
        gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.85)");
        gradient.addColorStop(1, "rgba(245, 158, 11, 0.95)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      audioAnimationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
    };
  }, [isPlaying]);

  // Play audio for a scene with Autobot radio collage
  const playSceneAudio = async (scene: VideoStoryboardScene): Promise<void> => {
    if (isMuted) return;

    if (isAutobotRadioMode) {
      await audioSpeechService.playAutobotRadioCollageSpeech(
        scene.sourceText,
        (_idx, _total, snippet) => {
          setActiveSnippet(snippet);
        },
        () => {
          setActiveSnippet(null);
        }
      );
    } else {
      const dot = dots.find((d) => d.id === scene.authorDotId) || dots[0] || {
        voice: "Zephyr",
      };
      await audioSpeechService.speakBrowserSpeech(scene.sourceText, dot.voice as any);
    }
  };

  // Play entire video storyboard sequentially
  const handlePlayFullSequence = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    setIsPlaying(true);
    let idx = currentSceneIdx;

    while (idx < scenes.length) {
      setCurrentSceneIdx(idx);
      setCurrentFrameIdx(0);
      const scene = scenes[idx];
      await playSceneAudio(scene);

      await new Promise((r) => setTimeout(r, 600));

      idx++;
      if (!audioSpeechService.isAutobotRadioPlaying() && !isPlaying) {
        break;
      }
    }

    setIsPlaying(false);
  };

  const handlePlayCurrentScene = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }
    if (!currentScene) return;

    setIsPlaying(true);
    await playSceneAudio(currentScene);
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioSpeechService.stopAutobotRadio();
    setIsPlaying(false);
    setActiveSnippet(null);
  };

  const handleNextScene = () => {
    handleStop();
    if (currentSceneIdx < scenes.length - 1) {
      setCurrentSceneIdx(currentSceneIdx + 1);
      setCurrentFrameIdx(0);
    }
  };

  const handlePrevScene = () => {
    handleStop();
    if (currentSceneIdx > 0) {
      setCurrentSceneIdx(currentSceneIdx - 1);
      setCurrentFrameIdx(0);
    }
  };

  const handleRegenerateFrames = () => {
    if (!currentScene) return;
    setIsRegeneratingImage(true);
    const newSeed = Math.floor(Math.random() * 10000);
    const newFrames = mediaCollageService.generateFramesForScene(
      currentScene.imagePrompt,
      newSeed,
      currentScene.sourceText,
      currentScene.title
    );

    setScenes((prev) =>
      prev.map((s, idx) =>
        idx === currentSceneIdx
          ? {
              ...s,
              imageUrl: newFrames[0]?.url || s.imageUrl,
              frames: newFrames,
            }
          : s
      )
    );

    setCurrentFrameIdx(0);
    setTimeout(() => setIsRegeneratingImage(false), 900);
  };

  // 16:9 Fullscreen handler
  const toggleFullscreen = () => {
    const el = videoViewportRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Synchronize fullscreen state with document event
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // Keyboard shortcuts: F for fullscreen, Space for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === " ") {
        e.preventDefault();
        handlePlayCurrentScene();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentScene]);

  // Toggle Mute
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioSpeechService.setMuted(nextMute);
  };

  // Soundboard manual sound triggers for Autobot Radio immersion
  const triggerSfxStatic = () => audioSpeechService.playRadioStatic(250);
  const triggerSfxTuning = () => audioSpeechService.playTuningChirp(600, 2600, 150);
  const triggerSfxSquelch = () => audioSpeechService.playSquelchClick();
  const triggerSfxMorse = () => audioSpeechService.playMorseCodeSnippet("NEXUS");

  // Prompt submission via Nexus
  const handleNexusPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPromptInput.trim() || isProcessing) return;
    const p = userPromptInput;
    setUserPromptInput("");
    await onSendMessage(p);
  };

  // Format timecode (MM:SS)
  const formatTimecode = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div
      ref={videoViewportRef}
      className={`h-full w-full flex flex-col bg-[#02040a] text-slate-100 overflow-hidden select-none relative ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      {/* 1. TOP NEXUS COMMAND BAR (All room controls delegated to Nexus) */}
      <header className="h-14 border-b border-slate-800/90 bg-[#060914]/95 px-4 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        {/* Left: Brand & Nexus Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <Film className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Space_Grotesk'] font-bold text-sm md:text-base text-white tracking-wide flex items-center gap-1.5">
                PAINEL DE VÍDEO & MULTIMÍDIA NEXUS
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                  16:9 CINEMA
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Montagem de frames em vídeo contínuo + Colagem de rádio Autobot
            </p>
          </div>
        </div>

        {/* Center: Quick Nexus Drawer Selectors (Menus de Controle) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          {/* Dedicated Coherent Video Generator Trigger */}
          <button
            onClick={() => setActiveNexusMenu(activeNexusMenu === "generator" ? "none" : "generator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
              activeNexusMenu === "generator"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/25"
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}
            title="Gerador de Vídeo Coerente: 6 Atos Narrativos Interligados"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gerador de Vídeo IA</span>
          </button>

          <button
            onClick={() => setActiveNexusMenu(activeNexusMenu === "texts" ? "none" : "texts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeNexusMenu === "texts"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Roteiro ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveNexusMenu(activeNexusMenu === "dots" ? "none" : "dots")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeNexusMenu === "dots"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dots ({dots.filter((d) => d.active).length}/{dots.length})</span>
          </button>

          <button
            onClick={() => setActiveNexusMenu(activeNexusMenu === "solutions" ? "none" : "solutions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeNexusMenu === "solutions"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Soluções ({solutions.length})</span>
          </button>

          {/* Quick Debate Trigger */}
          <button
            onClick={onToggleDebate}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition font-bold ${
              isDebating
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDebating ? "Pausar Debate" : "Debate dos Dots"}</span>
          </button>
        </div>

        {/* Right: Fullscreen 16:9, Radio & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Autobot Radio Toggle */}
          <button
            onClick={() => setIsAutobotRadioMode(!isAutobotRadioMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              isAutobotRadioMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30"
                : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200"
            }`}
            title="Alternar entre modo Rádio Autobot e voz comum"
          >
            <Radio className={`w-3.5 h-3.5 ${isAutobotRadioMode ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">
              {isAutobotRadioMode ? "Rádio Autobot" : "Voz Padrão"}
            </span>
          </button>

          {/* FPS Speed Selector (1, 2, 4, 8 FPS) */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs font-mono gap-1 text-slate-400">
            <span className="text-[10px] text-slate-500 mr-0.5">FPS:</span>
            {[1, 2, 4, 8].map((fps) => (
              <button
                key={fps}
                onClick={() => setPlaybackFps(fps)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
                  playbackFps === fps
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "hover:text-white"
                }`}
              >
                {fps}
              </button>
            ))}
          </div>

          {/* CRT Glitch Toggle */}
          <button
            onClick={() => setIsCrtGlitchActive(!isCrtGlitchActive)}
            className={`p-2 rounded-xl text-xs font-mono transition border ${
              isCrtGlitchActive
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800/60 text-slate-400 border-slate-700/60"
            }`}
            title="Efeito retrô CRT"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* DEDICATED 16:9 FULLSCREEN BUTTON */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-md shadow-cyan-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
            title="Tela cheia em resolução 16:9 (Atalho: Tecla F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isFullscreen ? "Sair Tela Cheia" : "Tela Cheia 16:9"}
            </span>
          </button>

          {/* Return to Classic Topology (Optional toggle if user wants legacy map) */}
          {onToggleClassicMode && (
            <button
              onClick={onToggleClassicMode}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
              title="Alternar para topologia clássica"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN 16:9 VIDEO WORKSPACE (Strict 16:9 resolution canvas, centered with cinema letterboxing) */}
      <div className="flex-1 flex flex-col justify-center items-center overflow-hidden relative bg-black p-1 sm:p-2">
        {/* Strictly 16:9 Aspect Ratio Video Box */}
        <div className="relative w-full aspect-video max-w-[calc((100vh-140px)*16/9)] max-h-[calc(100vh-140px)] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/40 border border-slate-800/80 bg-slate-950 flex flex-col justify-between">
          {/* Active Frame Image with Animated Pan/Zoom & Ken Burns Motion */}
          {currentFrame && (
            <div className="absolute inset-0 overflow-hidden">
              <img
                key={currentFrame.url + currentFrameIdx}
                src={currentFrame.url}
                alt={currentFrame.caption}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentFrame.fallbackUrl || "";
                }}
                className={`w-full h-full object-cover transition-all duration-[3000ms] ease-out select-none ${
                  isPlaying
                    ? currentFrameIdx % 2 === 0
                      ? "scale-110 translate-x-3 -translate-y-2"
                      : "scale-105 -translate-x-3 translate-y-1"
                    : "scale-100"
                }`}
              />
            </div>
          )}

          {/* CRT Glitch & Scanline Overlay */}
          {isCrtGlitchActive && (
            <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 mix-blend-overlay" />
          )}

          {/* Cinema Vignette and Holographic Cyber Tint */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/70 z-10" />

          {/* TOP HUD OVERLAY: Broadcaster, 16:9 Ratio, Resolution & Autobot Radio Frequency */}
          <div className="relative z-20 p-3 sm:p-4 flex items-center justify-between pointer-events-none font-mono text-xs">
            {/* Top Left: REC Telemetry & Frame State */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 shadow-lg">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-rose-500 animate-ping" : "bg-cyan-500"}`} />
                <span className="font-bold tracking-widest text-[11px]">
                  {isPlaying ? "REPRODUZINDO" : "PAUSADO"} ● {formatTimecode(timecodeSeconds)}
                </span>
                <span className="text-slate-500 hidden sm:inline">|</span>
                <span className="text-amber-400 font-semibold hidden sm:inline">
                  FRAME {currentFrameIdx + 1}/{activeFrames.length || 1}
                </span>
              </div>

              {/* Resolution Badge */}
              <div className="hidden md:flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-slate-300 text-[10px]">
                <Film className="w-3 h-3 text-cyan-400" />
                <span>16:9 • 1080p FHD</span>
              </div>
            </div>

            {/* Top Right: Autobot Radio Frequency Tuner */}
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/50 text-amber-300 shadow-lg">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span className="font-bold tracking-wider">
                {activeSnippet ? activeSnippet.frequency : currentScene?.radioStationFreq || "98.4 MHz"}
              </span>
              <span className="hidden sm:inline text-amber-300/80 text-[11px]">
                [{activeSnippet ? activeSnippet.stationName : currentScene?.radioStationLabel || "Transmissão Autobot"}]
              </span>
            </div>
          </div>

          {/* BOTTOM LEFT: Real-Time Audio Frequency Spectrogram */}
          <div className="absolute bottom-24 sm:bottom-28 left-4 z-20 pointer-events-none bg-black/70 backdrop-blur-md p-2 rounded-xl border border-cyan-500/30 shadow-lg hidden sm:block">
            <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              ESPECTRO RÁDIO AUTOBOT (Hz)
            </div>
            <canvas
              ref={waveformCanvasRef}
              width={160}
              height={36}
              className="w-40 h-9 rounded"
            />
          </div>

          {/* CENTER-BOTTOM: Dynamic Kinetic Subtitles / Teleprompter Banner */}
          <div className="relative z-20 px-3 sm:px-6 pb-2 pointer-events-none flex flex-col items-center">
            <div className="max-w-4xl w-full bg-black/90 backdrop-blur-lg border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl text-center">
              {/* Narrative Story Continuity Header */}
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-amber-500/20 pb-1 mb-1 text-slate-400">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Film className="w-3 h-3 text-cyan-400" />
                  SEQUÊNCIA NARRATIVA COERENTE
                </span>
                <span className="text-cyan-300 font-semibold truncate max-w-[280px]">
                  {currentFrame?.caption || currentScene?.title}
                </span>
              </div>

              {/* Speaker & Stage Badge */}
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 mb-1">
                <span className="font-bold text-white uppercase tracking-wide">
                  {currentScene?.authorName}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-semibold truncate">
                  {currentFrame?.stageName || currentScene?.title}
                </span>
              </div>

              {/* Spoken / Synthesized Text */}
              <p className="text-xs sm:text-sm md:text-base font-medium text-slate-100 leading-relaxed drop-shadow-md">
                {activeSnippet ? (
                  <span className="text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
                    "{activeSnippet.text}"
                  </span>
                ) : (
                  <span>"{currentScene?.sourceText}"</span>
                )}
              </p>
            </div>
          </div>

          {/* BOTTOM FRAME SCRUBBER & TIMELINE STRIP: Thumbnails of all frames forming the video */}
          <div className="relative z-20 bg-black/85 backdrop-blur-md border-t border-slate-800/80 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
            {/* Frame strip thumbnails */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline">
                FRAMES:
              </span>
              {activeFrames.map((frm, fIdx) => (
                <button
                  key={frm.id}
                  onClick={() => setCurrentFrameIdx(fIdx)}
                  className={`relative w-12 sm:w-16 h-7 sm:h-9 rounded-md overflow-hidden shrink-0 border transition-all ${
                    currentFrameIdx === fIdx
                      ? "border-cyan-400 ring-2 ring-cyan-500/50 scale-105"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                  title={frm.stageName}
                >
                  <img
                    src={frm.url}
                    alt={frm.caption}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = frm.fallbackUrl || "";
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 text-[8px] font-mono text-cyan-300 rounded">
                    #{fIdx + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Actions for Active Frame */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRegenerateFrames}
                disabled={isRegeneratingImage}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition disabled:opacity-50"
                title="Regenerar frames desta cena via IA"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingImage ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Novos Frames</span>
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
                title={isMuted ? "Ativar Áudio" : "Silenciar Áudio"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TRANSPORT & AUTOBOT SOUNDBOARD CONTROLS */}
      <footer className="h-14 border-t border-slate-800/90 bg-[#060914] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevScene}
            disabled={currentSceneIdx === 0}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Cena Anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayCurrentScene}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition"
            title={isPlaying ? "Pausar" : "Reproduzir vídeo e rádio"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={handleNextScene}
            disabled={currentSceneIdx === scenes.length - 1}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Próxima Cena"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayFullSequence}
            className="ml-2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20"
            title="Reproduzir todas as cenas em sequência"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>LER TUDO SEQUENCIAL</span>
          </button>

          <span className="text-xs font-mono text-slate-400 ml-2 hidden md:inline">
            Cena <strong className="text-white">{currentSceneIdx + 1}</strong> de {scenes.length}
          </span>
        </div>

        {/* Center: Autobot SFX Soundboard Quick Triggers */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 mr-1 text-[11px]">Sons Autobot:</span>
          <button
            onClick={triggerSfxStatic}
            className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 transition flex items-center gap-1"
            title="Estática de rádio AM"
          >
            <Zap className="w-3 h-3 text-amber-400" /> Estática
          </button>
          <button
            onClick={triggerSfxTuning}
            className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition flex items-center gap-1"
            title="Sintonia de frequência"
          >
            <Radio className="w-3 h-3 text-cyan-400" /> Varredura
          </button>
          <button
            onClick={triggerSfxSquelch}
            className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition flex items-center gap-1"
            title="Clique de rádio comunicador"
          >
            <Sliders className="w-3 h-3 text-emerald-400" /> Squelch
          </button>
          <button
            onClick={triggerSfxMorse}
            className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-700/60 hover:border-purple-500/40 transition flex items-center gap-1"
            title="Código Morse quântico"
          >
            <Activity className="w-3 h-3 text-purple-400" /> Morse
          </button>
        </div>

        {/* Right: Quick Prompt Input directly to Nexus & Room */}
        <form onSubmit={handleNexusPromptSubmit} className="flex items-center gap-2 max-w-sm w-full sm:w-auto">
          <input
            type="text"
            value={userPromptInput}
            onChange={(e) => setUserPromptInput(e.target.value)}
            placeholder="Enviar comando ao Nexus..."
            disabled={isProcessing}
            className="w-full sm:w-60 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
          />
          <button
            type="submit"
            disabled={isProcessing || !userPromptInput.trim()}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition shrink-0"
            title="Enviar para síntese dos Dots e geração de vídeo"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </footer>

      {/* 4. NEXUS MODAL / DRAWER SYSTEM: Embedded menus inside Nexus */}
      {activeNexusMenu !== "none" && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#080d1e] border-l border-slate-800 h-full flex flex-col shadow-2xl p-4 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {activeNexusMenu === "texts" && (
                  <>
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">Todos os Textos para o Nexus Ler</h3>
                  </>
                )}
                {activeNexusMenu === "dots" && (
                  <>
                    <Users className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white">Dots Especialistas na Sala</h3>
                  </>
                )}
                {activeNexusMenu === "generator" && (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">Gerador de Vídeo Coerente (IA)</h3>
                  </>
                )}
                {activeNexusMenu === "solutions" && (
                  <>
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Soluções para a Humanidade</h3>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveNexusMenu("none")}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar">
              {/* MENU 1: ALL TEXTS FOR NEXUS TO READ */}
              {activeNexusMenu === "texts" && (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300">
                    O Dot Nexus lerá o texto selecionado via rádio colagem e renderizará o vídeo em frames sincronizados:
                  </div>
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-400 font-bold">{msg.senderName}</span>
                        <span className="text-slate-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                        {msg.text}
                      </p>
                      <button
                        onClick={() => {
                          const scene = mediaCollageService.createSceneFromMessage(msg, i);
                          setScenes((prev) => [scene, ...prev]);
                          setCurrentSceneIdx(0);
                          setCurrentFrameIdx(0);
                          setActiveNexusMenu("none");
                          setTimeout(handlePlayCurrentScene, 150);
                        }}
                        className="self-end mt-1 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono border border-cyan-500/40 flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 fill-current" /> Reproduzir em Vídeo
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* MENU 2: DOTS MANAGEMENT */}
              {activeNexusMenu === "dots" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-mono text-slate-300">Criar Novo Dot</span>
                    <button
                      onClick={() => {
                        setActiveNexusMenu("none");
                        onOpenCreateModal();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Dot
                    </button>
                  </div>

                  {/* Proactivity Slider */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                      <span>Proatividade Geral da Sala:</span>
                      <strong className="text-cyan-400">{globalProactivity}%</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={globalProactivity}
                      onChange={(e) => onChangeGlobalProactivity(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* List of Dots */}
                  <div className="space-y-2">
                    {dots.map((dot) => (
                      <div
                        key={dot.id}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ backgroundColor: dot.color, color: "#fff" }}
                          >
                            {dot.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{dot.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{dot.topic}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onToggleDotActive(dot.id)}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition ${
                              dot.active
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {dot.active ? "Ativo" : "Inativo"}
                          </button>
                          <button
                            onClick={() => {
                              setActiveNexusMenu("none");
                              onEditDot(dot);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                            title="Editar"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MENU 3: HUMANITY SOLUTIONS */}
              {activeNexusMenu === "solutions" && (
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      await onSynthesizeNewSolution();
                    }}
                    disabled={isSynthesizing}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSynthesizing ? "Sintetizando..." : "Sintetizar Nova Solução Global"}</span>
                  </button>

                  <div className="space-y-2.5">
                    {solutions.map((sol) => (
                      <div
                        key={sol.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-emerald-400 font-bold">{sol.targetCrisis}</span>
                          <span className="text-amber-400">Score: {sol.feasibilityScore}%</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{sol.title}</h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {sol.summary}
                        </p>
                        <button
                          onClick={() => {
                            const scene = mediaCollageService.createSceneFromSolution(sol);
                            setScenes((prev) => [scene, ...prev]);
                            setCurrentSceneIdx(0);
                            setCurrentFrameIdx(0);
                            setActiveNexusMenu("none");
                            setTimeout(handlePlayCurrentScene, 150);
                          }}
                          className="self-end mt-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono border border-emerald-500/40 flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 fill-current" /> Ver em Vídeo 16:9
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MENU 4: COHERENT VIDEO GENERATOR */}
              {activeNexusMenu === "generator" && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>GERADOR DE VÍDEO NARRATIVO 16:9</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Gera uma sequência de 6 atos conectados sobre a mesma missão: Mesa Redonda Autobot &rarr; Código Universal &rarr; Enxame Quântico &rarr; 10 Bilhões de Especialistas &rarr; Profissões Elevadas na Terra &rarr; Prosperidade Planetária.
                    </p>
                  </div>

                  {/* Mission Objective Presets */}
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                      Missões Predefinidas para a Humanidade:
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          title: "Enxame Quântico de 10 Bilhões de Especialistas para Todas as Profissões",
                          desc: "Dot 7 gerando código universal para Windows, Android e Supercomputadores Quânticos, enquanto Dot 8 orquestra a elevação de todas as profissões da história em todo o planeta Terra.",
                          tag: "Dot 7 & 8 • Principal",
                          badgeColor: "border-cyan-500/40 text-cyan-300",
                        },
                        {
                          title: "Código Multiplataforma Dot 7: De Windows e Android a Supercomputadores Quânticos",
                          desc: "Compilação de ponta a ponta sem atrito em qualquer dispositivo, orquestrando nós quânticos para acelerar a computação científica mundial.",
                          tag: "Dot 7 • Software",
                          badgeColor: "border-blue-500/40 text-blue-300",
                        },
                        {
                          title: "Mesa Redonda Autobot: Consenso Estratégico para o Trabalho Planetário",
                          desc: "Conferência tática dos Dots deliberando medidas conjuntas de transição justa, dignidade e elevação de todas as profissões da Terra.",
                          tag: "Dots 1 a 8 • Consenso",
                          badgeColor: "border-amber-500/40 text-amber-300",
                        },
                        {
                          title: "Microfusão Hélio-3 e Redes Elétricas Supercondutoras",
                          desc: "Matriz limpa ininterrupta gerando energia abundante a custo marginal zero para abastecer hospitais, fábricas e cidades.",
                          tag: "Dot 2 + Dot 5 • Energia",
                          badgeColor: "border-emerald-500/40 text-emerald-300",
                        },
                        {
                          title: "Coletores Atmosféricos de Grafeno & Erradicação da Seca no Saara",
                          desc: "Nanotecnologia biomimética extraindo água potável pura do ar desértico sem gasto de energia, irrigando lavouras regenerativas.",
                          tag: "Dot 1 + Dot 6 • Biosfera",
                          badgeColor: "border-teal-500/40 text-teal-300",
                        },
                      ].map((item, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setGenObjectiveTitle(item.title);
                            setGenObjectiveDesc(item.desc);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition group"
                        >
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-bold text-white group-hover:text-amber-300 transition truncate max-w-[220px]">
                              {item.title}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold shrink-0 ${item.badgeColor}`}>
                              {item.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Objective Title & Description Inputs */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        Título da Missão:
                      </label>
                      <input
                        type="text"
                        value={genObjectiveTitle}
                        onChange={(e) => setGenObjectiveTitle(e.target.value)}
                        placeholder="Ex: Enxame Quântico para Todas as Profissões"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        Descrição da Missão:
                      </label>
                      <textarea
                        rows={3}
                        value={genObjectiveDesc}
                        onChange={(e) => setGenObjectiveDesc(e.target.value)}
                        placeholder="Descreva o plano dos Dots para trabalhar e aprimorar as profissões..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Primary Trigger Button */}
                  <button
                    onClick={() => handleGenerateMissionVideo()}
                    disabled={isGeneratingVideo || !genObjectiveTitle.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingVideo ? "Gerando Sequência..." : "GERAR VÍDEO NARRATIVO 16:9"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
