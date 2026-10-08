import React from "react";
import { TelemetryLog, RoutingDecision } from "../types";
import {
  Activity,
  Terminal,
  Target,
  Zap,
  CheckCircle2,
  Trash2,
  Cpu,
} from "lucide-react";

interface TelemetryDiagnosticsProps {
  logs: TelemetryLog[];
  onClearLogs: () => void;
  lastRoutingDecision: RoutingDecision | null;
  activeSpeakerName?: string | null;
}

export const TelemetryDiagnostics: React.FC<TelemetryDiagnosticsProps> = ({
  logs,
  onClearLogs,
  lastRoutingDecision,
  activeSpeakerName,
}) => {
  return (
    <div className="h-44 border-t border-slate-800/80 bg-[#070b16]/95 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800/80 shrink-0">
      {/* Left: Active Topic Scoring & Routing Decision */}
      <div className="w-full md:w-80 p-3.5 flex flex-col justify-between shrink-0 bg-slate-950/40">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5 font-['Space_Grotesk']">
              <Target className="w-3.5 h-3.5 text-cyan-400" /> Tópico Identificado
            </span>
            <span className="font-mono text-emerald-400 text-[11px] font-bold">
              {lastRoutingDecision
                ? `${Math.round(lastRoutingDecision.confidence * 100)}% Match`
                : "Aguardando"}
            </span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200">
            {lastRoutingDecision?.detectedTopic || "Nenhum tópico ativo no momento"}
          </div>
        </div>

        {lastRoutingDecision?.reasoning && (
          <p className="text-[10px] text-slate-400 font-mono leading-tight mt-1 truncate">
            {lastRoutingDecision.reasoning}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10.5px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            Voz Ativa:
          </span>
          <span className="text-cyan-300 font-semibold truncate max-w-[130px]">
            {activeSpeakerName || "Nenhum no momento"}
          </span>
        </div>
      </div>

      {/* Right: Real-time Telemetry Diagnostics Logs */}
      <div className="flex-1 p-3.5 flex flex-col min-h-0 bg-[#060913]/90">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5 shrink-0">
          <span className="flex items-center gap-1.5 font-['Space_Grotesk']">
            <Terminal className="w-3.5 h-3.5 text-purple-400" /> Diagnóstico & Telemetria do Multiplexador
          </span>
          <button
            onClick={onClearLogs}
            className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" /> Limpar Logs
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 font-mono text-[10.5px] space-y-1.5 text-slate-400 scrollbar-thin">
          {logs.map((log) => {
            const levelColor =
              log.level === "router"
                ? "text-cyan-400"
                : log.level === "voice"
                ? "text-blue-400"
                : log.level === "debate"
                ? "text-amber-400"
                : log.level === "solution"
                ? "text-emerald-400"
                : "text-slate-400";

            return (
              <div key={log.id} className="leading-snug flex items-start gap-2">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={`shrink-0 font-bold uppercase text-[9.5px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 ${levelColor}`}>
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
