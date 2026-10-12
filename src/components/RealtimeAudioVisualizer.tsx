import React, { useRef, useEffect, useState } from "react";
import {
  audioSpeechService,
  VisualizerState,
} from "../services/audioSpeechService";
import { Radio, Mic, Volume2, Sparkles, Activity } from "lucide-react";

interface RealtimeAudioVisualizerProps {
  activeSpeakerName?: string | null;
  detectedTopic?: string | null;
  isLiveMode?: boolean;
  isProcessing?: boolean;
}

export const RealtimeAudioVisualizer: React.FC<RealtimeAudioVisualizerProps> = ({
  activeSpeakerName,
  detectedTopic,
  isLiveMode,
  isProcessing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentSource, setCurrentSource] = useState<"mic" | "speaker" | "idle">("idle");
  const [dbLevel, setDbLevel] = useState<number>(-60);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bars = 28;
    const barWidth = 3;
    const barGap = 3;

    // Smoothed values array
    const smoothHeights = new Float32Array(bars);

    const render = () => {
      const state: VisualizerState = audioSpeechService.getVisualizerData();
      setCurrentSource(state.source);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Calculate approximate dB
      if (state.volume > 0.01) {
        const approxDb = Math.round(20 * Math.log10(state.volume));
        setDbLevel(Math.max(-50, approxDb));
      } else {
        setDbLevel(-60);
      }

      const freqData = state.frequencyData;
      const binStep = Math.max(1, Math.floor(freqData.length / bars));

      // Determine palette by active state
      let primaryColor = "#06b6d4"; // cyan for mic
      let secondaryColor = "#10b981"; // emerald

      if (state.source === "speaker") {
        primaryColor = "#6366f1"; // indigo for speaker
        secondaryColor = "#a855f7"; // purple
      } else if (isLiveMode && state.source === "idle") {
        primaryColor = "#3b82f6"; // blue
        secondaryColor = "#8b5cf6"; // purple
      } else if (state.source === "idle") {
        primaryColor = "#475569";
        secondaryColor = "#334155";
      }

      // Draw mirrored / centered responsive waveform bars
      const totalWidth = bars * (barWidth + barGap);
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;

      for (let i = 0; i < bars; i++) {
        const rawVal = freqData[i * binStep] || 0;
        let targetHeight = (rawVal / 255) * (height - 6);

        // Add subtle idle breath if live mode or idle
        if (state.source === "idle") {
          const t = Date.now() * 0.003;
          targetHeight = isLiveMode
            ? 3 + Math.sin(t + i * 0.3) * 2.5
            : 2 + Math.sin(t + i * 0.2) * 1.5;
        }

        // Interpolation
        smoothHeights[i] += (targetHeight - smoothHeights[i]) * 0.28;
        const h = Math.max(2, smoothHeights[i]);

        const x = startX + i * (barWidth + barGap);

        // Gradient for each bar
        const gradient = ctx.createLinearGradient(
          x,
          centerY - h / 2,
          x,
          centerY + h / 2
        );
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Rounded bar
        ctx.roundRect(x, centerY - h / 2, barWidth, h, 2);
        ctx.fill();
      }

      // Glow effect if active
      if (state.source !== "idle" || isLiveMode) {
        ctx.save();
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLiveMode]);

  return (
    <div className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-[#0b1020]/95 border border-slate-700/80 shadow-xl backdrop-blur-xl animate-fade-in select-none">
      {/* Left Status Pill with Icons */}
      <div className="flex items-center gap-2 min-w-0">
        {currentSource === "mic" ? (
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-xs font-['Space_Grotesk'] font-semibold truncate">
              Ouvindo sua voz em tempo real...
            </span>
          </div>
        ) : currentSource === "speaker" || activeSpeakerName ? (
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-xs font-['Space_Grotesk'] font-semibold truncate">
              Voz Ativa: {activeSpeakerName || "Multiplexer Neural"}
            </span>
          </div>
        ) : isLiveMode ? (
          <div className="flex items-center gap-1.5 text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
            <span className="text-xs font-['Space_Grotesk'] font-semibold truncate">
              Gemini Live Ativo • Fale naturalmente
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-mono truncate">
              {detectedTopic
                ? `Tópico: ${detectedTopic}`
                : "Multiplexer pronto para ouvir ou ler"}
            </span>
          </div>
        )}
      </div>

      {/* Center / Right: Dynamic HTML5 Canvas Waveform */}
      <div className="flex items-center gap-3">
        {/* Real-time Spectrum Waveform */}
        <canvas
          ref={canvasRef}
          width={180}
          height={26}
          className="h-6 w-36 md:w-44 block"
        />

        {/* Live Decibel / Level Meter */}
        <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-500 border-l border-slate-800 pl-2.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentSource === "mic"
                ? "bg-cyan-400"
                : currentSource === "speaker"
                ? "bg-indigo-400"
                : "bg-slate-600"
            }`}
          ></span>
          <span>{dbLevel > -55 ? `${dbLevel} dB` : "Silêncio"}</span>
        </div>
      </div>
    </div>
  );
};
