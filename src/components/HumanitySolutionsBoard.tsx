import React from "react";
import { HumanitySolution, DotAgent } from "../types";
import {
  Lightbulb,
  CheckCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";

interface HumanitySolutionsBoardProps {
  solutions: HumanitySolution[];
  onSynthesizeNewSolution: () => void;
  isSynthesizing: boolean;
  activeDots: DotAgent[];
}

export const HumanitySolutionsBoard: React.FC<HumanitySolutionsBoardProps> = ({
  solutions,
  onSynthesizeNewSolution,
  isSynthesizing,
  activeDots,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (solution: HumanitySolution) => {
    const text = `=== BLUEPRINT DE SOLUÇÃO DA HUMANIDADE ===
Título: ${solution.title}
Crise Alvo: ${solution.targetCrisis}
Status: ${solution.status}
Viabilidade: ${solution.feasibilityScore}%
Autores: ${solution.authors.join(", ")}

Resumo Executivo:
${solution.summary}

Pilares Técnicos:
${solution.technicalBreakdown.map((p, i) => `${i + 1}. ${p}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopiedId(solution.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="w-80 md:w-88 border-l border-slate-800/80 bg-[#090d19]/80 flex flex-col z-20 shrink-0 h-full backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-['Space_Grotesk'] font-bold text-sm text-slate-100">
              Soluções Globais
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Consenso Multidimensional
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-mono font-bold">
          {solutions.length}
        </span>
      </div>

      {/* Trigger Manual Synthesis Action Button */}
      <div className="p-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
        <button
          onClick={onSynthesizeNewSolution}
          disabled={isSynthesizing}
          className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all hover:scale-101 active:scale-99 disabled:opacity-50"
        >
          {isSynthesizing ? (
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{isSynthesizing ? "Sintetizando Consenso..." : "Sintetizar Blueprint Oficial"}</span>
        </button>
      </div>

      {/* Solutions Cards Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
        {solutions.map((sol) => (
          <div
            key={sol.id}
            className="p-3.5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl space-y-2.5 transition-all shadow-md group relative"
          >
            {/* Authors & Status Tag */}
            <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
              <span className="text-cyan-400 font-bold truncate max-w-[170px]">
                {sol.authors.join(" & ")}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border font-medium shrink-0 ${
                  sol.status === "Consenso Alcançado"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                }`}
              >
                {sol.status}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xs font-bold font-['Space_Grotesk'] text-slate-100 leading-snug group-hover:text-amber-200 transition-colors">
              {sol.title}
            </h3>

            {/* Crisis Badge */}
            <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
              Alvo: <span className="text-slate-200">{sol.targetCrisis}</span>
            </div>

            {/* Executive Summary */}
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {sol.summary}
            </p>

            {/* Technical Pillars */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-amber-400" /> Pilares de Execução:
              </span>
              <ul className="space-y-1">
                {sol.technicalBreakdown.map((pilar, idx) => (
                  <li
                    key={idx}
                    className="text-[10.5px] text-slate-400 flex items-start gap-1.5 leading-tight"
                  >
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{pilar}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Feasibility Meter & Copy Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Viabilidade:</span>
                <span className="text-emerald-400 font-bold">
                  {sol.feasibilityScore}%
                </span>
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                    style={{ width: `${sol.feasibilityScore}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => handleCopy(sol)}
                className="hover:text-amber-300 text-slate-500 flex items-center gap-1 transition-colors"
                title="Copiar Blueprint completo"
              >
                {copiedId === sol.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
