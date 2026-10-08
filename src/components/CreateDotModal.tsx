import React, { useState, useEffect } from "react";
import { DotAgent, VoiceName } from "../types";
import { X, Bot, Sparkles, Volume2, Palette, Shield } from "lucide-react";

interface CreateDotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDot: (dot: DotAgent) => void;
  dotToEdit?: DotAgent | null;
}

export const CreateDotModal: React.FC<CreateDotModalProps> = ({
  isOpen,
  onClose,
  onSaveDot,
  dotToEdit,
}) => {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<DotAgent["category"]>("humanity");
  const [voice, setVoice] = useState<VoiceName>("Zephyr");
  const [color, setColor] = useState("#3b82f6");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [proactivity, setProactivity] = useState(80);

  useEffect(() => {
    if (dotToEdit) {
      setName(dotToEdit.name);
      setTopic(dotToEdit.topic);
      setCategory(dotToEdit.category);
      setVoice(dotToEdit.voice);
      setColor(dotToEdit.color);
      setSystemPrompt(dotToEdit.systemPrompt);
      setProactivity(dotToEdit.proactivity);
    } else {
      setName("");
      setTopic("");
      setCategory("humanity");
      setVoice("Zephyr");
      setColor("#10b981");
      setSystemPrompt("");
      setProactivity(80);
    }
  }, [dotToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim() || !systemPrompt.trim()) return;

    const newDot: DotAgent = {
      id: dotToEdit?.id || `dot-${Date.now()}`,
      name: name.trim(),
      topic: topic.trim(),
      category,
      voice,
      color,
      accentBg: `${color}25`,
      icon: category === "finance" ? "TrendingUp" : category === "science" ? "Zap" : "Bot",
      systemPrompt: systemPrompt.trim(),
      active: true,
      proactivity,
      status: "idle",
      stats: dotToEdit?.stats || {
        responsesCount: 0,
        solutionsCount: 0,
        confidenceAvg: 95,
      },
    };

    onSaveDot(newDot);
    onClose();
  };

  const presetColors = [
    { name: "Verde Esmeralda", hex: "#10b981" },
    { name: "Ciano Quântico", hex: "#06b6d4" },
    { name: "Azul Safira", hex: "#3b82f6" },
    { name: "Roxo Nebulosa", hex: "#a855f7" },
    { name: "Âmbar Solar", hex: "#f59e0b" },
    { name: "Rosa Plasma", hex: "#ec4899" },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c1222] border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-['Space_Grotesk'] font-bold text-lg text-white">
              {dotToEdit ? "Editar Agente Dot" : "Criar Agente Dot Autônomo"}
            </h3>
            <p className="text-xs text-slate-400">
              Configure a especialidade e personalidade do agente no multiplexador.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Dot
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dr. Oceanus, Quantum Fabric"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Domínio / Tópico Especializado
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Despoluição Oceânica, Fusão"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Voz Gemini
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value as VoiceName)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Zephyr">Zephyr (Brilhante)</option>
                <option value="Puck">Puck (Enérgico)</option>
                <option value="Charon">Charon (Profundo)</option>
                <option value="Kore">Kore (Firme)</option>
                <option value="Fenrir">Fenrir (Assertivo)</option>
                <option value="Leda">Leda (Harmoniosa)</option>
                <option value="Aoede">Aoede (Melódica)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="humanity">Problemas Globais</option>
                <option value="science">Ciência & Física</option>
                <option value="finance">Mercados & Finanças</option>
                <option value="philosophy">Ética & Alinhamento</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cor Temática
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {presetColors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      color === c.hex ? "ring-2 ring-white scale-110" : "opacity-80"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Nível de Proatividade</span>
              <span className="font-mono text-cyan-400">{proactivity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={proactivity}
              onChange={(e) => setProactivity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Diretrizes de Personalidade & Prompt de Sistema
            </label>
            <textarea
              required
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Você é um especialista pioneiro... Proponha soluções radicais e complemente os outros Dots com rigor científico."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all hover:scale-102"
            >
              {dotToEdit ? "Salvar Alterações" : "Implantar no Multiplexador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
