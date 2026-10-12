import React from "react";
import { DotAgent } from "../types";
import {
  Bot,
  Plus,
  Sliders,
  Volume2,
  Trash2,
  Edit2,
  Sparkles,
  Zap,
  TrendingUp,
  Leaf,
  Activity,
  Shield,
  Truck,
  Code,
  Users,
} from "lucide-react";

interface DotsManagerSidebarProps {
  dots: DotAgent[];
  onToggleDotActive: (id: string) => void;
  onEditDot: (dot: DotAgent) => void;
  onDeleteDot: (id: string) => void;
  onOpenCreateModal: () => void;
  globalProactivity: number;
  onChangeGlobalProactivity: (val: number) => void;
  selectedDotId?: string | null;
  onSelectDot: (dot: DotAgent) => void;
}

export const DotsManagerSidebar: React.FC<DotsManagerSidebarProps> = ({
  dots,
  onToggleDotActive,
  onEditDot,
  onDeleteDot,
  onOpenCreateModal,
  globalProactivity,
  onChangeGlobalProactivity,
  selectedDotId,
  onSelectDot,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Leaf":
        return <Leaf className="w-4 h-4" />;
      case "Zap":
        return <Zap className="w-4 h-4" />;
      case "Activity":
        return <Activity className="w-4 h-4" />;
      case "Shield":
        return <Shield className="w-4 h-4" />;
      case "TrendingUp":
        return <TrendingUp className="w-4 h-4" />;
      case "Truck":
        return <Truck className="w-4 h-4" />;
      case "Code":
        return <Code className="w-4 h-4" />;
      case "Users":
        return <Users className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const activeCount = dots.filter((d) => d.active).length;

  return (
    <aside className="w-80 md:w-88 border-r border-slate-800/80 bg-[#090d19]/80 flex flex-col z-20 shrink-0 h-full backdrop-blur-md">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-['Space_Grotesk'] font-bold text-sm text-slate-100">
              IAs Autônomas (Dots)
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              {activeCount} de {dots.length} ativos
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-102"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Dot</span>
        </button>
      </div>

      {/* Dots List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {dots.map((dot) => {
          const isSelected = selectedDotId === dot.id;
          return (
            <div
              key={dot.id}
              onClick={() => onSelectDot(dot)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                dot.active
                  ? isSelected
                    ? "bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                    : "bg-slate-900/50 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  : "bg-slate-950/40 border-slate-900 opacity-50 hover:opacity-75"
              }`}
            >
              {/* Dot Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{ backgroundColor: dot.color }}
                  >
                    {getIcon(dot.icon)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-['Space_Grotesk'] font-bold text-xs text-slate-100 truncate flex items-center gap-1.5">
                      {dot.name}
                      {dot.status === "speaking" && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      )}
                    </h3>
                    <span className="text-[10px] text-cyan-400 font-mono truncate block">
                      {dot.topic}
                    </span>
                  </div>
                </div>

                {/* Toggle Active Checkbox */}
                <input
                  type="checkbox"
                  checked={dot.active}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleDotActive(dot.id);
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer shrink-0 mt-1"
                />
              </div>

              {/* System Instruction Excerpt */}
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 font-sans mb-2 pl-0.5">
                "{dot.systemPrompt}"
              </p>

              {/* Footer info: Voice + Proactivity + Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-slate-400" />
                  Voz: <strong className="text-slate-300">{dot.voice}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-amber-400/90 font-medium">
                    {dot.proactivity}% Proat.
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDot(dot);
                      }}
                      className="p-1 hover:text-cyan-400 transition-colors"
                      title="Editar Dot"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDot(dot.id);
                      }}
                      className="p-1 hover:text-rose-400 transition-colors"
                      title="Remover Dot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Proactivity Control Slider */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 font-['Space_Grotesk']">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Proatividade do Multiplexador
          </span>
          <span className="font-mono text-cyan-400 text-xs font-bold">
            {globalProactivity}%
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          value={globalProactivity}
          onChange={(e) => onChangeGlobalProactivity(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />

        <p className="text-[10px] text-slate-400 leading-snug">
          Com valores altos, os Dots intervêm autonomamente e propõem soluções complementares entre si.
        </p>
      </div>
    </aside>
  );
};
