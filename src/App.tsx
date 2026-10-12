import React, { useState, useEffect, useRef } from "react";
import {
  DotAgent,
  ChatMessage,
  HumanitySolution,
  TelemetryLog,
  RoutingDecision,
  OrchestrationMode,
  ModelMode,
} from "./types";
import { INITIAL_DOTS, INITIAL_SOLUTIONS, IDLE_UNSOLVED_CHALLENGES } from "./data/presetDots";
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
  chatWithMultiplexer,
  requestTTS,
  executeDebateStep,
  synthesizeHumanitySolution,
  formulateNexusConsensus,
} from "./services/apiClient";
import { audioSpeechService } from "./services/audioSpeechService";

export default function App() {
  const [dots, setDots] = useState<DotAgent[]>(INITIAL_DOTS);
  const [solutions, setSolutions] = useState<HumanitySolution[]>(INITIAL_SOLUTIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      senderType: "multiplexer",
      senderName: "Multiplexer Neural Core",
      text: "Olá! Sou o Multiplexer Neural integrado. Estou conectado aos Dots autônomos para escutar suas perguntas e conceber soluções em português brasileiro. Você pode usar a barra de digitação ou o Modo Live para conversar por voz.",
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

  // Live Mode & Orchestration
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [orchestrationMode, setOrchestrationMode] = useState<OrchestrationMode>("multiplexer_integrated");
  const [modelMode, setModelMode] = useState<ModelMode>("gemini-3.8-live");

  const [activeSpeakerDotId, setActiveSpeakerDotId] = useState<string | null>(null);
  const [activeSpeakingMessageId, setActiveSpeakingMessageId] = useState<string | null>(null);
  const [lastRoutingDecision, setLastRoutingDecision] = useState<RoutingDecision | null>(null);
  const [selectedDot, setSelectedDot] = useState<DotAgent | null>(null);

  // Processing Dot IDs (triggers CSS glow, pulsing aura and rotating dashed ring in canvas)
  const [processingDotIds, setProcessingDotIds] = useState<string[]>([]);

  // 30 Seconds Inactivity Autonomous Innovation
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(30);
  const [isIdleResolving, setIsIdleResolving] = useState<boolean>(false);
  const lastInteractionRef = useRef<number>(Date.now());

  const resetInactivityTimer = () => {
    lastInteractionRef.current = Date.now();
    setIdleSecondsRemaining(30);
  };

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dotToEdit, setDotToEdit] = useState<DotAgent | null>(null);

  const debateIntervalRef = useRef<any>(null);
  const isDebatingRef = useRef<boolean>(false);
  isDebatingRef.current = isDebating;

  const isLiveModeRef = useRef<boolean>(false);
  isLiveModeRef.current = isLiveMode;

  const addLog = (level: TelemetryLog["level"], message: string) => {
    const newLog: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      level,
      message,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 80)]);
  };

  const multiplexerAgent: DotAgent = {
    id: "router",
    name: "Multiplexer Neural Core",
    topic: "Orquestrador Integrado",
    category: "humanity",
    voice: "Zephyr",
    color: "#6366f1",
    accentBg: "rgba(99, 102, 241, 0.2)",
    icon: "Bot",
    systemPrompt: "Master orchestrator",
    active: true,
    proactivity: 100,
    status: "idle",
    stats: { responsesCount: 0, solutionsCount: 0, confidenceAvg: 100 },
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

  // Live Mode Toggle Handler
  const handleToggleLiveMode = () => {
    if (isLiveMode) {
      setIsLiveMode(false);
      audioSpeechService.setLiveMode(false);
      audioSpeechService.stopSpeechRecognition();
      addLog("voice", "Modo Gemini Live desativado.");
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-live-off-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          senderType: "system",
          senderName: "Modo Live",
          text: "Modo Gemini Live encerrado. Use a barra para digitar ou reativar.",
        },
      ]);
    } else {
      setIsLiveMode(true);
      audioSpeechService.setLiveMode(true);
      addLog("voice", "Modo Gemini Live ativado! Escuta contínua conectada.");

      const liveNotice: ChatMessage = {
        id: `msg-live-on-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        senderType: "system",
        senderName: "Gemini Live",
        text: "🔴 Modo Gemini Live Ativado: Fale livremente no microfone. O Multiplexer ouvirá e responderá em tempo real em Português Brasileiro.",
      };
      setMessages((prev) => [...prev, liveNotice]);

      // Spoken greeting
      playSpeech(
        "Modo Gemini Live conectado. Estou te escutando em tempo real em português brasileiro. Pode falar sua dúvida ou proposta.",
        multiplexerAgent
      );

      // Start continuous recognition
      audioSpeechService.startSpeechRecognition(
        (transcript, isFinal) => {
          if (isFinal && transcript.trim()) {
            handleSendMessage(transcript.trim());
          }
        },
        (err) => {
          console.warn("Live voice recognition warning:", err);
        },
        () => {
          // Restart if still in live mode
          if (isLiveModeRef.current) {
            audioSpeechService.startSpeechRecognition(
              (transcript, isFinal) => {
                if (isFinal && transcript.trim()) {
                  handleSendMessage(transcript.trim());
                }
              },
              undefined,
              undefined,
              true
            );
          }
        },
        true
      );
    }
  };

  // Autonomous 30-Second Inactivity Room Solver Effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (isProcessing || isDebating || isIdleResolving) {
        lastInteractionRef.current = Date.now();
        return;
      }

      const elapsed = Math.floor((Date.now() - lastInteractionRef.current) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setIdleSecondsRemaining(remaining);

      if (remaining === 0) {
        lastInteractionRef.current = Date.now();
        setIdleSecondsRemaining(30);
        handleTriggerIdleChallenge();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing, isDebating, isIdleResolving, dots]);

  // Execute Complete Opinion & Final Consensus Pipeline
  const executeConsensusFlow = async (queryText: string, isFromIdle: boolean = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    resetInactivityTimer();

    const activeDots = dots.filter((d) => d.active);
    const validDots = activeDots.length >= 2 ? activeDots : INITIAL_DOTS.slice(0, 3);

    try {
      // 1. Route to determine relevant topic & specialist Dots
      addLog(
        "router",
        isFromIdle
          ? `Sala autônoma (30s): Selecionando Dots para o desafio: "${queryText.slice(0, 45)}..."`
          : `Multiplexer roteando e alocando Dots para: "${queryText}"`
      );

      const decision = await routeMultiplexer(queryText, validDots);
      setLastRoutingDecision(decision);

      const primaryDot =
        validDots.find((d) => d.id === decision.selectedDotId) || validDots[0];
      const secondaryDot =
        validDots.find((d) => d.id === decision.secondaryDotId) ||
        validDots.find((d) => d.id !== primaryDot.id) ||
        validDots[1] ||
        validDots[0];

      const participating = [primaryDot, secondaryDot];

      // 2. Set processingDotIds: triggers CSS pulse and glow effects on both dots!
      setProcessingDotIds([primaryDot.id, secondaryDot.id]);
      addLog(
        "router",
        `Dots [${primaryDot.name}] e [${secondaryDot.name}] processando dados e enviando opiniões ao Nexus...`
      );

      // 3. Each Dot sends their opinion to the Nexus
      const collectedOpinions: { dotName: string; topic: string; text: string }[] = [];

      for (const dot of participating) {
        setActiveSpeakerDotId(dot.id);
        const prompt = `Como ${dot.name} (Especialista em ${dot.topic}), elabore seu pensamento técnico detalhado e envie sua opinião para o Nexus a respeito de: "${queryText}". Resuma sua proposta em 2 a 3 frases objetivas e assertivas:`;

        const chatRes = await chatWithDot(
          prompt,
          dot,
          messages,
          globalProactivity,
          validDots
        );

        collectedOpinions.push({
          dotName: dot.name,
          topic: dot.topic,
          text: chatRes.text,
        });

        const opMsgId = `msg-op-${dot.id}-${Date.now()}`;
        const opMsg: ChatMessage = {
          id: opMsgId,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          senderType: "dot",
          senderDotId: dot.id,
          senderName: dot.name,
          text: chatRes.text,
          voiceName: dot.voice,
          opinionTarget: "Nexus",
        };
        setMessages((prev) => [...prev, opMsg]);
        setActiveSpeakerDotId(null);
      }

      // 4. Nexus Master processes the consensus
      setProcessingDotIds(["router"]);
      addLog("solution", "Nexus consolidando pensamentos de todos os Dots em um consenso definitivo resumido...");

      const consensusResult = await formulateNexusConsensus(
        queryText,
        collectedOpinions,
        participating
      );

      // 5. Present the final consensus in summary with title and few words
      const consensusMsgId = `msg-consensus-${Date.now()}`;
      const consensusMsg: ChatMessage = {
        id: consensusMsgId,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        senderType: "multiplexer",
        senderName: "Multiplexer Neural Core",
        text: `${consensusResult.title}: ${consensusResult.shortSummary}`,
        isConsensus: true,
        consensus: consensusResult,
        voiceName: "Zephyr",
      };

      setMessages((prev) => [...prev, consensusMsg]);

      // 6. Register on Humanity Solutions Board
      const newSol: HumanitySolution = {
        id: consensusResult.id,
        title: consensusResult.title,
        targetCrisis: consensusResult.targetCrisis || queryText,
        status: "Consenso Alcançado",
        feasibilityScore: consensusResult.feasibilityScore || 96,
        summary: consensusResult.shortSummary,
        technicalBreakdown: collectedOpinions.map((o) => `${o.dotName}: ${o.text}`),
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        authors: consensusResult.participatingDots,
        upvotes: 1,
      };
      setSolutions((prev) => [newSol, ...prev]);

      // 7. Voice output (summarized title and few words)
      await playSpeech(
        `Consenso alcançado: ${consensusResult.title}. ${consensusResult.shortSummary}`,
        multiplexerAgent,
        consensusMsgId
      );
    } catch (err: any) {
      addLog("info", `Erro na formulação de consenso: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingDotIds([]);
      setActiveSpeakerDotId(null);
      resetInactivityTimer();
    }
  };

  // Handle user query submission
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;
    resetInactivityTimer();

    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      senderType: "user",
      senderName: "Você (Humano)",
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    await executeConsensusFlow(queryText, false);
  };

  // Handle Inactivity 30s Challenge Trigger
  const handleTriggerIdleChallenge = async () => {
    if (isProcessing || isDebating || isIdleResolving) return;
    setIsIdleResolving(true);
    resetInactivityTimer();

    const randomChallenge =
      IDLE_UNSOLVED_CHALLENGES[
        Math.floor(Math.random() * IDLE_UNSOLVED_CHALLENGES.length)
      ];

    const idleNotice: ChatMessage = {
      id: `msg-idle-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      senderType: "system",
      senderName: "Sala Autônoma (30s)",
      text: `⏱️ 30 segundos sem perguntas: Os Dots assumiram a liderança e estão resolvendo: "${randomChallenge}"`,
    };
    setMessages((prev) => [...prev, idleNotice]);

    try {
      await executeConsensusFlow(randomChallenge, true);
    } finally {
      setIsIdleResolving(false);
      resetInactivityTimer();
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
    if (msg.senderType === "multiplexer") {
      playSpeech(msg.text, multiplexerAgent, msg.id);
      return;
    }
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

  const activeSpeakerName =
    activeSpeakerDotId === "router"
      ? "Multiplexer Neural Core"
      : dots.find((d) => d.id === activeSpeakerDotId)?.name || null;

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
        idleSecondsRemaining={idleSecondsRemaining}
        isIdleResolving={isIdleResolving}
        onTriggerImmediateIdleSolve={handleTriggerIdleChallenge}
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
          <div className="h-60 md:h-64 shrink-0 border-b border-slate-800/80 relative">
            <MultiplexerTopologyCanvas
              dots={dots}
              activeSpeakerDotId={activeSpeakerDotId}
              processingDotIds={processingDotIds}
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

          {/* Floating Gemini.com Style Conversation Bar */}
          <div className="border-t border-slate-800/80 bg-gradient-to-t from-[#050814] via-[#050814]/95 to-transparent shrink-0">
            <GeminiConversationBar
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              activeSpeakerDotName={activeSpeakerName}
              detectedTopic={lastRoutingDecision?.detectedTopic}
              isLiveMode={isLiveMode}
              onToggleLiveMode={handleToggleLiveMode}
              orchestrationMode={orchestrationMode}
              onChangeOrchestrationMode={setOrchestrationMode}
              modelMode={modelMode}
              onChangeModelMode={setModelMode}
              onSynthesizeSolution={() => handleSynthesizeNewSolution()}
              onUserActivity={resetInactivityTimer}
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

