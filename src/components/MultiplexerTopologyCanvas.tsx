import React, { useRef, useEffect, useState } from "react";
import { DotAgent } from "../types";
import { Activity, Cpu, Radio, Sparkles } from "lucide-react";

interface MultiplexerTopologyCanvasProps {
  dots: DotAgent[];
  activeSpeakerDotId: string | null;
  processingDotIds?: string[];
  onSelectDot: (dot: DotAgent) => void;
  isRouting: boolean;
  activeTopic?: string | null;
}

interface CanvasNode {
  id: string;
  name: string;
  topic: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  isRouter?: boolean;
  isUser?: boolean;
  dotRef?: DotAgent;
}

interface Particle {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export const MultiplexerTopologyCanvas: React.FC<MultiplexerTopologyCanvasProps> = ({
  dots,
  activeSpeakerDotId,
  processingDotIds = [],
  onSelectDot,
  isRouting,
  activeTopic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<CanvasNode | null>(null);
  const [renderedNodes, setRenderedNodes] = useState<CanvasNode[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    const handleResize = () => {
      if (!canvas || !container) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
      setRenderedNodes(getNodes());
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Compute nodes
    const getNodes = (): CanvasNode[] => {
      const cx = width / 2;
      const cy = height / 2;
      const nodes: CanvasNode[] = [];

      // 1. Multiplexer Router (Center)
      nodes.push({
        id: "router",
        name: "MULTIPLEXER",
        topic: "Roteador Neural & Semântico",
        x: cx,
        y: cy,
        radius: 26,
        color: "#6366f1",
        isRouter: true,
      });

      // 2. User Node (Left side)
      const userX = Math.max(50, cx - Math.min(width * 0.38, 220));
      nodes.push({
        id: "user",
        name: "HUMANO / VOZ",
        topic: "Entrada de Contexto",
        x: userX,
        y: cy,
        radius: 18,
        color: "#06b6d4",
        isUser: true,
      });

      // 3. Autonomous Dots (Radial distribution)
      const activeDots = dots.filter((d) => d.active);
      const dotCount = activeDots.length;
      const radiusDist = Math.min(width, height) * 0.36;

      activeDots.forEach((dot, index) => {
        const angle = (index * (Math.PI * 2)) / dotCount - Math.PI / 2;
        nodes.push({
          id: dot.id,
          name: dot.name,
          topic: dot.topic,
          x: cx + Math.cos(angle) * radiusDist,
          y: cy + Math.sin(angle) * radiusDist,
          radius: 20,
          color: dot.color,
          dotRef: dot,
        });
      });

      return nodes;
    };

    const initialNodes = getNodes();
    setRenderedNodes(initialNodes);

    let stepCounter = 0;

    const render = () => {
      stepCounter++;
      ctx.clearRect(0, 0, width, height);

      const nodes = getNodes();
      const routerNode = nodes.find((n) => n.id === "router");
      const userNode = nodes.find((n) => n.id === "user");

      // Spawn periodic signal particles if routing
      if (stepCounter % 20 === 0 && routerNode && userNode) {
        if (isRouting) {
          particlesRef.current.push({
            fromX: userNode.x,
            fromY: userNode.y,
            toX: routerNode.x,
            toY: routerNode.y,
            progress: 0,
            speed: 0.035,
            color: "#06b6d4",
            size: 3.5,
          });
        }
      }

      // Spawn particles to speaker or processing dots
      if (stepCounter % 14 === 0 && routerNode) {
        if (activeSpeakerDotId) {
          const speakerNode = nodes.find((n) => n.id === activeSpeakerDotId);
          if (speakerNode) {
            particlesRef.current.push({
              fromX: routerNode.x,
              fromY: routerNode.y,
              toX: speakerNode.x,
              toY: speakerNode.y,
              progress: 0,
              speed: 0.04,
              color: speakerNode.color,
              size: 4,
            });
          }
        }

        if (processingDotIds.length > 0) {
          processingDotIds.forEach((pId) => {
            const pNode = nodes.find((n) => n.id === pId);
            if (pNode) {
              particlesRef.current.push({
                fromX: routerNode.x,
                fromY: routerNode.y,
                toX: pNode.x,
                toY: pNode.y,
                progress: 0,
                speed: 0.05,
                color: "#f59e0b",
                size: 3,
              });
            }
          });
        }
      }

      // Draw Connection Lines
      if (userNode && routerNode) {
        ctx.beginPath();
        ctx.moveTo(userNode.x, userNode.y);
        ctx.lineTo(routerNode.x, routerNode.y);
        ctx.strokeStyle = isRouting
          ? "rgba(6, 182, 212, 0.7)"
          : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = isRouting ? 2.5 : 1.2;
        ctx.stroke();
      }

      nodes.forEach((node) => {
        if (!node.isRouter && !node.isUser && routerNode) {
          const isSpeaking = node.id === activeSpeakerDotId;
          const isProcessing = processingDotIds.includes(node.id);

          ctx.beginPath();
          ctx.moveTo(routerNode.x, routerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = isSpeaking
            ? node.color
            : isProcessing
            ? "#f59e0b"
            : "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = isSpeaking || isProcessing ? 3 : 1;
          ctx.stroke();

          // Inter-dot mesh line if speaking or processing
          if (isSpeaking || isProcessing) {
            ctx.save();
            ctx.strokeStyle = `${node.color}33`;
            ctx.lineWidth = 1;
            nodes.forEach((peer) => {
              if (!peer.isRouter && !peer.isUser && peer.id !== node.id) {
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(peer.x, peer.y);
                ctx.stroke();
              }
            });
            ctx.restore();
          }
        }
      });

      // Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const currentX = p.fromX + (p.toX - p.fromX) * p.progress;
        const currentY = p.fromY + (p.toY - p.fromY) * p.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      }

      // Draw Nodes in Canvas with rich pulsing canvas rings
      nodes.forEach((node) => {
        const isSpeaking = node.id === activeSpeakerDotId;
        const isProcessing = processingDotIds.includes(node.id);
        const isHovered = hoveredNode?.id === node.id;

        ctx.save();

        // Canvas Speaking Waves & Glow
        if (isSpeaking) {
          // Inner energetic ripple
          const pulseSize = node.radius + 6 + Math.sin(stepCounter * 0.15) * 6;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}99`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Outer shockwave
          const waveSize = node.radius + 14 + (stepCounter % 40) * 0.8;
          const waveAlpha = Math.max(0, 1 - (stepCounter % 40) / 40);
          ctx.beginPath();
          ctx.arc(node.x, node.y, waveSize, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}${Math.floor(waveAlpha * 255)
            .toString(16)
            .padStart(2, "0")}`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.shadowColor = node.color;
          ctx.shadowBlur = 35;
        } else if (isProcessing) {
          // Orbiting computational dash arc
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(stepCounter * 0.08);
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 8, 0, Math.PI * 1.5);
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();

          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 25;
        } else if (node.isRouter && isRouting) {
          const pulseSize = node.radius + 7 + Math.sin(stepCounter * 0.12) * 5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(99, 102, 241, 0.7)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowColor = "#6366f1";
          ctx.shadowBlur = 24;
        } else if (isHovered) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 16;
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          isHovered ? node.radius + 2 : node.radius,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = node.color;
        ctx.fill();

        ctx.lineWidth = isSpeaking || isProcessing ? 2.5 : 2;
        ctx.strokeStyle =
          isSpeaking || isProcessing ? "#ffffff" : "rgba(255, 255, 255, 0.4)";
        ctx.stroke();
        ctx.restore();

        // Node Label
        ctx.save();
        ctx.fillStyle = isSpeaking || isProcessing ? "#ffffff" : "#cbd5e1";
        ctx.font =
          isSpeaking || isProcessing
            ? "bold 11px Plus Jakarta Sans, sans-serif"
            : "10px Plus Jakarta Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.radius + 14);

        // Subtitle / Topic
        ctx.fillStyle = isSpeaking
          ? node.color
          : isProcessing
          ? "#f59e0b"
          : "#64748b";
        ctx.font = "8.5px JetBrains Mono, monospace";
        const shortTopic =
          node.topic.length > 20 ? `${node.topic.slice(0, 18)}..` : node.topic;
        ctx.fillText(shortTopic, node.x, node.y + node.radius + 25);
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    // Mouse interactions
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const nodes = getNodes();
      const found = nodes.find((n) => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
      });

      setHoveredNode(found || null);
      canvas.style.cursor = found ? "pointer" : "default";
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const nodes = getNodes();
      const found = nodes.find((n) => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
      });

      if (found && found.dotRef) {
        onSelectDot(found.dotRef);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dots, activeSpeakerDotId, processingDotIds, isRouting]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#070b16]/90 border-b border-slate-800/80 flex flex-col select-none"
    >
      {/* Top Topology Status Bar */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span className="text-[11px] font-mono tracking-wider text-slate-300 font-semibold uppercase">
          Topologia do Multiplexador Neural
        </span>
        {activeTopic && (
          <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md">
            Foco: {activeTopic}
          </span>
        )}
      </div>

      {/* Legend with speaking and processing indicators */}
      <div className="absolute top-3 right-4 z-10 hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Falando
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span> Processando
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Nexus Master
        </span>
      </div>

      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* REAL CSS GLOW & PULSE OVERLAY LAYER (Positioned directly over active nodes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {renderedNodes.map((node) => {
          const isSpeaking = node.id === activeSpeakerDotId;
          const isProcessing = processingDotIds.includes(node.id);
          const isRouterActive = node.isRouter && isRouting;

          if (!isSpeaking && !isProcessing && !isRouterActive) return null;

          return (
            <div
              key={`css-glow-${node.id}`}
              className="absolute pointer-events-none flex items-center justify-center"
              style={
                {
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  "--dot-color": node.color,
                } as React.CSSProperties
              }
            >
              {/* CSS Speaking Pulsing Aura & Shockwaves */}
              {isSpeaking && (
                <>
                  <div
                    className="absolute w-16 h-16 rounded-full dot-css-shockwave"
                    style={{ borderColor: node.color }}
                  />
                  <div
                    className="absolute w-20 h-20 rounded-full dot-css-shockwave"
                    style={{ borderColor: node.color, animationDelay: "0.6s" }}
                  />
                  <div
                    className="absolute w-12 h-12 rounded-full dot-css-pulse-speaking"
                    style={{
                      backgroundColor: `${node.color}40`,
                    }}
                  />
                  <span className="absolute px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-950/95 text-cyan-300 border border-cyan-400/60 dot-css-badge-speaking whitespace-nowrap shadow-lg">
                    🔊 FALANDO
                  </span>
                </>
              )}

              {/* CSS Processing Orbital Halo, Spin & Glow */}
              {isProcessing && (
                <>
                  <div className="absolute w-16 h-16 rounded-full border-2 border-dashed border-amber-400 dot-css-processing-spin" />
                  <div className="absolute w-20 h-20 rounded-full border border-amber-300/60 dot-css-processing-ripple" />
                  <div
                    className="absolute w-12 h-12 rounded-full dot-css-processing-glow"
                    style={{ backgroundColor: "rgba(245, 158, 11, 0.3)" }}
                  />
                  <span className="absolute px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-950/95 text-amber-300 border border-amber-400/60 dot-css-badge-processing whitespace-nowrap shadow-lg">
                    ⚡ PROCESSANDO DADOS
                  </span>
                </>
              )}

              {/* CSS Router Nexus Glow */}
              {isRouterActive && (
                <>
                  <div className="absolute w-20 h-20 rounded-full border border-indigo-500/80 dot-css-processing-spin" />
                  <div
                    className="absolute w-14 h-14 rounded-full dot-css-router-glow"
                    style={{ backgroundColor: "rgba(99, 102, 241, 0.35)" }}
                  />
                  <span className="absolute px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-950/95 text-indigo-300 border border-indigo-400/60 dot-css-badge-router whitespace-nowrap shadow-lg">
                    NEXUS ATIVO
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && hoveredNode.dotRef && (
        <div className="absolute bottom-2 left-4 z-10 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200 pointer-events-none backdrop-blur-md font-mono flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {hoveredNode.name} - {hoveredNode.topic} (Voz: {hoveredNode.dotRef.voice})
          </span>
        </div>
      )}
    </div>
  );
};
