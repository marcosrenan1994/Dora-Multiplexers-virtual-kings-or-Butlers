import React, { useRef, useEffect, useState } from "react";
import { DotAgent } from "../types";
import { Maximize2, RotateCcw, Activity } from "lucide-react";

interface MultiplexerTopologyCanvasProps {
  dots: DotAgent[];
  activeSpeakerDotId: string | null;
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
  onSelectDot,
  isRouting,
  activeTopic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<CanvasNode | null>(null);

  // Trigger routing particles
  const triggerParticles = (fromId: string, toId: string, color: string, count: number = 6) => {
    // Generated inside the render loop
  };

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
    };

    window.addEventListener("resize", handleResize);

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

    let stepCounter = 0;

    const render = () => {
      stepCounter++;
      ctx.clearRect(0, 0, width, height);

      const nodes = getNodes();
      const routerNode = nodes.find((n) => n.id === "router");
      const userNode = nodes.find((n) => n.id === "user");

      // Spawn periodic signal particles if routing or speaking
      if (stepCounter % 25 === 0 && routerNode && userNode) {
        if (isRouting) {
          particlesRef.current.push({
            fromX: userNode.x,
            fromY: userNode.y,
            toX: routerNode.x,
            toY: routerNode.y,
            progress: 0,
            speed: 0.03,
            color: "#06b6d4",
            size: 3.5,
          });
        }
      }

      if (activeSpeakerDotId && stepCounter % 15 === 0 && routerNode) {
        const speakerNode = nodes.find((n) => n.id === activeSpeakerDotId);
        if (speakerNode) {
          particlesRef.current.push({
            fromX: routerNode.x,
            fromY: routerNode.y,
            toX: speakerNode.x,
            toY: speakerNode.y,
            progress: 0,
            speed: 0.035,
            color: speakerNode.color,
            size: 3.5,
          });
        }
      }

      // Draw Connection Lines
      // User to Router line
      if (userNode && routerNode) {
        ctx.beginPath();
        ctx.moveTo(userNode.x, userNode.y);
        ctx.lineTo(routerNode.x, routerNode.y);
        ctx.strokeStyle = isRouting
          ? "rgba(6, 182, 212, 0.7)"
          : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = isRouting ? 2.5 : 1.2;
        if (isRouting) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Router to Dots lines
      nodes.forEach((node) => {
        if (!node.isRouter && !node.isUser && routerNode) {
          const isSpeaking = node.id === activeSpeakerDotId;
          ctx.beginPath();
          ctx.moveTo(routerNode.x, routerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = isSpeaking
            ? node.color
            : "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = isSpeaking ? 3 : 1;
          ctx.stroke();

          // If speaking, draw secondary mesh line to adjacent dots
          if (isSpeaking) {
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
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }

      // Draw Nodes
      nodes.forEach((node) => {
        const isSpeaking = node.id === activeSpeakerDotId;
        const isHovered = hoveredNode?.id === node.id;

        ctx.save();

        // Pulsing rings for active speakers or router
        if (isSpeaking || (node.isRouter && isRouting)) {
          const pulseSize = node.radius + 8 + Math.sin(stepCounter * 0.1) * 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}66`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Outer aura
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 24;
        } else if (isHovered) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 14;
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

        ctx.lineWidth = 2;
        ctx.strokeStyle = isSpeaking ? "#ffffff" : "rgba(255, 255, 255, 0.4)";
        ctx.stroke();
        ctx.restore();

        // Node Label
        ctx.save();
        ctx.fillStyle = isSpeaking ? "#ffffff" : "#cbd5e1";
        ctx.font = isSpeaking
          ? "bold 11px Plus Jakarta Sans, sans-serif"
          : "10px Plus Jakarta Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.radius + 14);

        // Subtitle / Topic
        ctx.fillStyle = isSpeaking ? node.color : "#64748b";
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dots, activeSpeakerDotId, isRouting]);

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

      {/* Legend */}
      <div className="absolute top-3 right-4 z-10 hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Entrada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Router
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Dot Ativo
        </span>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

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
