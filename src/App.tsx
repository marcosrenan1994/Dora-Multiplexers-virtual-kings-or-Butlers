import React, { useState, useEffect, useRef } from "react";
import { DotAgent, ChatMessage, HumanitySolution, TelemetryLog, RoutingDecision } from "./types";
import { INITIAL_DOTS, INITIAL_SOLUTIONS } from "./data/presetDots";
import { HeaderNavbar } from "./components/HeaderNavbar";
import { DotsManagerSidebar } from "./components/DotsManagerSidebar";
import { MultiplexerTopologyCanvas } from "./components/MultiplexerTopologyCanvas";
import { DebateTranscriptFeed } from "./components/DebateTranscriptFeed";
import { GeminiConversationBar } from "./components/GeminiConversationBar";
import { HumanitySolutionsBoard } from "./components/HumanitySolutionsBoard";
import { TelemetryDiagnostics } from "./components/TelemetryDiagnostics";
import { CreateDotModal } from "./components/CreateDotModal";
import {
  routeMultiplexer,
  chatWithDot,
  requestTTS,
  executeDebateStep,
  synthesizeHumanitySolution,
} from "./services/apiClient";
import { audioSpeechService } from "./services/audioSpeechService";

export default function App() {
  const [dots, setDots] = useState<DotAgent[]>(INITIAL_DOTS);
  const [solutions, setSolutions] = useState<HumanitySolution[]>(INITIAL_SOLUTIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      senderType: "system",
      senderName: "Dot-Nexus Core",
      text: "Protocolo Dot-Nexus Ativo: O agente multiplexador neural está pronto para conectar sua voz e intenções aos Dots autônomos proativos.",
    },
  ]);
  const [logs, setLogs] = useState<TelemetryLog[]>([
    {
      id: "log-1",
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      level: "info",
      message: "Engine multiplexador inicializado com sucesso.",
    },
    {
      id: "log-2",
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      level: "router",
      message: "6 nós de IAs autônomas proativas carregados na topologia.",
    },
  ]);

  const [currentMode, setCurrentMode] = useState<"interactive" | "debate">("interactive");
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [globalProactivity, setGlobalProactivity] = useState<number>(85);

  const [activeSpeakerDotId, setActiveSpeakerDotId] = useState<string | null>(null);
  const [activeSpeakingMessageId, setActiveSpeakingMessageId] = useState<string | null>(null);
  const [lastRoutingDecision, setLastRoutingDecision] = useState<RoutingDecision | null>(null);
  const [selectedDot, setSelectedDot] = useState<DotAgent | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dotToEdit, setDotToEdit] = useState<DotAgent | null>(null);

  const debateIntervalRef = useRef<any>(null);
  const isDebatingRef = useRef<boolean>(false);
  isDebatingRef.current = isDebating;

  const addLog = (level: TelemetryLog["level"], message: string) => {
    const newLog: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      level,
      message,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 80)]);
  };

  // Play audio for a response
  const playSpeech = async (
    text: string,
    dot: DotAgent,
    messageId?: string
  ) => {
    if (isMuted) return;

    setActiveSpeakerDotId(dot.id);
    if (messageId) setActiveSpeakingMessageId(messageId);

    addLog("voice", `Sintetizando voz "${dot.voice}" para ${dot.name}`);

    try {
      const ttsResult = await requestTTS(text, dot.voice, dot.name);
      if (ttsResult.audioBase64) {
        await audioSpeechService.playBase64Audio(
          ttsResult.audioBase64,
          ttsResult.mimeType || "audio/wav",
          () => {
            setActiveSpeakerDotId(dot.id);
          },
          () => {
            setActiveSpeakerDotId(null);
            setActiveSpeakingMessageId(null);
          }
        );
      } else {
        await audioSpeechService.speakBrowserSpeech(
          text,
          dot.voice,
          () => {
            setActiveSpeakerDotId(dot.id);
          },
          () => {
            setActiveSpeakerDotId(null);
            setActiveSpeakingMessageId(null);
          }
        );
      }
    } catch (err) {
      setActiveSpeakerDotId(null);
      setActiveSpeakingMessageId(null);
    }
  };

  // Handle user query submission
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      senderType: "user",
      senderName: "Você (Humano)",
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    addLog("router", `Analisando intenção e roteamento para: "${queryText}"`);

    try {
      // Step 1: Multiplexer Route
      const activeDots = dots.filter((d) => d.active);
      const decision = await routeMultiplexer(queryText, activeDots);
      setLastRoutingDecision(decision);

      addLog(
        "router",
        `Roteado para ${decision.selectedDotId} (${Math.round(decision.confidence * 100)}% Match) - ${decision.reasoning}`
      );

      // Add routing announcement
      const routerMsg: ChatMessage = {
        id: `msg-route-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        senderType: "router",
        senderName: "Multiplexador Neural",
        text: `Tópico [${decision.detectedTopic}] direcionado para ${
          dots.find((d) => d.id === decision.selectedDotId)?.name || "Dot Especialista"
        }`,
        reasoning: decision.reasoning,
      };
      setMessages((prev) => [...prev, routerMsg]);

      // Step 2: Dot Response
      const targetDot = dots.find((d) => d.id === decision.selectedDotId) || activeDots[0];
      if (targetDot) {
        setActiveSpeakerDotId(targetDot.id);

        const chatResult = await chatWithDot(
          queryText,
          targetDot,
          messages,
          globalProactivity,
          activeDots
        );

        const dotMsgId = `msg-dot-${Date.now()}`;
        const dotMsg: ChatMessage = {
          id: dotMsgId,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          senderType: "dot",
          senderDotId: targetDot.id,
          senderName: targetDot.name,
          text: chatResult.text,
          voiceName: targetDot.voice,
        };

        setMessages((prev) => [...prev, dotMsg]);

        // Voice speech
        await playSpeech(chatResult.text, targetDot, dotMsgId);

        // Step 3: Proactive Chime if available
        if (chatResult.proactiveChime) {
          const chimeDot = dots.find((d) => d.id === chatResult.proactiveChime.dotId);
          if (chimeDot) {
            addLog("debate", `Intervenção Proativa de ${chimeDot.name}`);
            const chimeMsgId = `msg-chime-${Date.now()}`;
            const chimeMsg: ChatMessage = {
              id: chimeMsgId,
              timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              senderType: "dot",
              senderDotId: chimeDot.id,
              senderName: chimeDot.name,
              text: chatResult.proactiveChime.text,
              isProactiveChime: true,
              voiceName: chimeDot.voice,
            };
            setMessages((prev) => [...prev, chimeMsg]);
            await playSpeech(chatResult.proactiveChime.text, chimeDot, chimeMsgId);
          }
        }
      }
    } catch (err: any) {
      addLog("info", `Erro no processamento: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setActiveSpeakerDotId(null);
    }
  };

  // Toggle Autonomous Inter-Dot Debate
  const handleToggleDebate = () => {
    if (isDebating) {
      setIsDebating(false);
      if (debateIntervalRef.current) {
        clearInterval(debateIntervalRef.current);
        debateIntervalRef.current = null;
      }
      addLog("debate", "Mesa-redonda de debate autônomo pausada.");
    } else {
      setIsDebating(true);
      setCurrentMode("debate");
      addLog("debate", "Mesa-redonda de debate autônomo ativada!");

      const activeDots = dots.filter((d) => d.active);
      if (activeDots.length < 2) {
        addLog("info", "Ative pelo menos 2 Dots para iniciar o debate cooperativo.");
        setIsDebating(false);
        return;
      }

      const debateThemes = [
        "Transição Energética Definitiva: Fusão Nuclear Hélio-3 vs Malhas Biosféricas",
        "Engenharia Genômica Universal e a Prevenção Imediata de Pandemias",
        "Financiamento Regenerativo e o Algoritmo Quântico do Dot Superior",
        "Alinhamento Ético de Superinteligência e Salvaguarda da Consciência Humana",
        "Erradicação Global da Fome e Logística Descentralizada de Nutrientes",
      ];
      const chosenTheme = debateThemes[Math.floor(Math.random() * debateThemes.length)];

      const debateNotice: ChatMessage = {
        id: `msg-debate-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        senderType: "system",
        senderName: "Debate Coletivo",
        text: `Mesa-Redonda Iniciada: "${chosenTheme}"`,
      };
      setMessages((prev) => [...prev, debateNotice]);
      setLastRoutingDecision({
        detectedTopic: chosenTheme,
        confidence: 0.99,
        selectedDotId: activeDots[0].id,
        reasoning: "Debate multi-agente cooperativo focado em solução definitiva.",
      });

      let currentSpeakerIdx = 0;
      let lastSpeakerDot: DotAgent | null = null;
      let lastSpeakerText = `Como podemos equacionar de vez o problema de ${chosenTheme}?`;

      const runDebateTurn = async () => {
        if (!isDebatingRef.current) return;

        const speakerDot = activeDots[currentSpeakerIdx % activeDots.length];
        currentSpeakerIdx++;

        try {
          addLog("debate", `${speakerDot.name} formulando proposta no debate...`);

          const stepResult = await executeDebateStep(
            chosenTheme,
            speakerDot,
            lastSpeakerDot,
            lastSpeakerText,
            activeDots
          );

          lastSpeakerDot = speakerDot;
          lastSpeakerText = stepResult.text;

          const turnMsgId = `msg-turn-${Date.now()}`;
          const turnMsg: ChatMessage = {
            id: turnMsgId,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            senderType: "dot",
            senderDotId: speakerDot.id,
            senderName: speakerDot.name,
            text: stepResult.text,
            voiceName: speakerDot.voice,
          };

          setMessages((prev) => [...prev, turnMsg]);
          await playSpeech(stepResult.text, speakerDot, turnMsgId);

          // Every 3 turns, attempt automatic solution synthesis
          if (currentSpeakerIdx % 3 === 0) {
            handleSynthesizeNewSolution(chosenTheme);
          }
        } catch (err: any) {
          addLog("debate", `Erro no turno de debate: ${err.message}`);
        }
      };

      runDebateTurn();
      debateIntervalRef.current = setInterval(runDebateTurn, 9000);
    }
  };

  useEffect(() => {
    return () => {
      if (debateIntervalRef.current) {
        clearInterval(debateIntervalRef.current);
      }
    };
  }, []);

  // Synthesize Humanity Solution
  const handleSynthesizeNewSolution = async (explicitTheme?: string) => {
    setIsSynthesizing(true);
    const theme = explicitTheme || lastRoutingDecision?.detectedTopic || "Crise Climática & Energia";
    addLog("solution", `Sintetizando Blueprint de Solução para: "${theme}"`);

    try {
      const activeDots = dots.filter((d) => d.active);
      const conversationSnippet = messages
        .slice(-8)
        .map((m) => `${m.senderName}: ${m.text}`)
        .join("\n");

      const newSolution = await synthesizeHumanitySolution(
        theme,
        conversationSnippet,
        activeDots
      );

      setSolutions((prev) => [newSolution, ...prev]);
      addLog("solution", `Consenso alcançado! Solução criada: "${newSolution.title}"`);

      const solutionNotice: ChatMessage = {
        id: `msg-sol-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        senderType: "system",
        senderName: "Consenso Registrado",
        text: `💡 Nova Solução Formulada: "${newSolution.title}" (Viabilidade: ${newSolution.feasibilityScore}%) pelos Dots: ${newSolution.authors.join(", ")}`,
      };
      setMessages((prev) => [...prev, solutionNotice]);
    } catch (err: any) {
      addLog("solution", `Erro na síntese de solução: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Replay voice of any message
  const handlePlayMessageVoice = (msg: ChatMessage) => {
    const dot = dots.find((d) => d.id === msg.senderDotId);
    if (dot) {
      playSpeech(msg.text, dot, msg.id);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioSpeechService.setMuted(nextMute);
    addLog("voice", nextMute ? "Voz silenciada." : "Voz ativada.");
  };

  // Dot Management
  const handleToggleDotActive = (id: string) => {
    setDots((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d))
    );
    const target = dots.find((d) => d.id === id);
    if (target) {
      addLog("info", `Dot "${target.name}" marcado como ${target.active ? "Inativo" : "Ativo"}.`);
    }
  };

  const handleEditDot = (dot: DotAgent) => {
    setDotToEdit(dot);
    setIsCreateModalOpen(true);
  };

  const handleDeleteDot = (id: string) => {
    setDots((prev) => prev.filter((d) => d.id !== id));
    addLog("info", `Dot removido da rede.`);
  };

  const handleSaveDot = (newDot: DotAgent) => {
    setDots((prev) => {
      const exists = prev.some((d) => d.id === newDot.id);
      if (exists) {
        return prev.map((d) => (d.id === newDot.id ? newDot : d));
      }
      return [...prev, newDot];
    });
    addLog("info", `Dot "${newDot.name}" configurado e integrado ao multiplexador.`);
  };

  const activeSpeakerName = dots.find((d) => d.id === activeSpeakerDotId)?.name || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050814] text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Header Navbar */}
      <HeaderNavbar
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          if (mode === "debate" && !isDebating) {
            handleToggleDebate();
          } else if (mode === "interactive" && isDebating) {
            handleToggleDebate();
          }
        }}
        isDebating={isDebating}
        onToggleDebate={handleToggleDebate}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        activeDotsCount={dots.filter((d) => d.active).length}
        totalSolutionsCount={solutions.length}
        onOpenNewDotModal={() => {
          setDotToEdit(null);
          setIsCreateModalOpen(true);
        }}
        onSelectPresetTopic={(t) => handleSendMessage(t)}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Autonomous Dots Manager */}
        <DotsManagerSidebar
          dots={dots}
          onToggleDotActive={handleToggleDotActive}
          onEditDot={handleEditDot}
          onDeleteDot={handleDeleteDot}
          onOpenCreateModal={() => {
            setDotToEdit(null);
            setIsCreateModalOpen(true);
          }}
          globalProactivity={globalProactivity}
          onChangeGlobalProactivity={setGlobalProactivity}
          selectedDotId={selectedDot?.id}
          onSelectDot={(dot) => setSelectedDot(dot)}
        />

        {/* Center Canvas + Feed + Conversation Bar */}
        <section className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {/* Top Half: Multiplexer Topology Canvas */}
          <div className="h-64 md:h-72 shrink-0 border-b border-slate-800/80 relative">
            <MultiplexerTopologyCanvas
              dots={dots}
              activeSpeakerDotId={activeSpeakerDotId}
              onSelectDot={(dot) => setSelectedDot(dot)}
              isRouting={isProcessing}
              activeTopic={lastRoutingDecision?.detectedTopic}
            />
          </div>

          {/* Middle: Transcript & Dialogue Feed */}
          <DebateTranscriptFeed
            messages={messages}
            onClearMessages={() => setMessages([])}
            onPlayMessageVoice={handlePlayMessageVoice}
            dots={dots}
            activeSpeakingMessageId={activeSpeakingMessageId}
          />

          {/* Floating / Anchored Gemini Conversation Bar */}
          <div className="border-t border-slate-800/80 bg-gradient-to-t from-[#050814] via-[#050814]/95 to-transparent shrink-0">
            <GeminiConversationBar
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              activeSpeakerDotName={activeSpeakerName}
              detectedTopic={lastRoutingDecision?.detectedTopic}
            />
          </div>

          {/* Bottom Telemetry Diagnostics */}
          <TelemetryDiagnostics
            logs={logs}
            onClearLogs={() => setLogs([])}
            lastRoutingDecision={lastRoutingDecision}
            activeSpeakerName={activeSpeakerName}
          />
        </section>

        {/* Right Sidebar: Humanity Solutions Board */}
        <HumanitySolutionsBoard
          solutions={solutions}
          onSynthesizeNewSolution={() => handleSynthesizeNewSolution()}
          isSynthesizing={isSynthesizing}
          activeDots={dots.filter((d) => d.active)}
        />
      </main>

      {/* 3. Create or Edit Dot Modal */}
      <CreateDotModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setDotToEdit(null);
        }}
        onSaveDot={handleSaveDot}
        dotToEdit={dotToEdit}
      />
    </div>
  );
}
