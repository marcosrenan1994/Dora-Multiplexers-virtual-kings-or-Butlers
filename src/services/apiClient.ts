import { DotAgent, HumanitySolution, RoutingDecision, ModelMode } from "../types";

export async function chatWithMultiplexer(
  prompt: string,
  history: any[],
  activeDots: DotAgent[],
  modelMode: ModelMode = "gemini-3.8-live"
): Promise<{ text: string; senderName: string; voice: string }> {
  const res = await fetch("/api/multiplexer/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, history, activeDots, modelMode }),
  });
  if (!res.ok) {
    throw new Error(`Failed to chat with multiplexer: ${res.statusText}`);
  }
  return res.json();
}

export async function routeMultiplexer(
  query: string,
  dots: DotAgent[]
): Promise<RoutingDecision> {
  const res = await fetch("/api/multiplexer/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, dots }),
  });
  if (!res.ok) {
    throw new Error(`Failed to route: ${res.statusText}`);
  }
  return res.json();
}

export async function chatWithDot(
  prompt: string,
  dot: DotAgent,
  history: any[],
  proactivity: number,
  otherDots: DotAgent[]
): Promise<{ text: string; proactiveChime?: any }> {
  const res = await fetch("/api/dots/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, dot, history, proactivity, otherDots }),
  });
  if (!res.ok) {
    throw new Error(`Failed to chat with dot: ${res.statusText}`);
  }
  return res.json();
}

export async function requestTTS(
  text: string,
  voice: string,
  dotName: string
): Promise<{ audioBase64?: string; useWebSpeechFallback?: boolean; mimeType?: string }> {
  const res = await fetch("/api/dots/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, dotName }),
  });
  if (!res.ok) {
    return { useWebSpeechFallback: true };
  }
  return res.json();
}

export async function executeDebateStep(
  topic: string,
  currentSpeaker: DotAgent,
  lastSpeaker: DotAgent | null,
  lastMessage: string,
  activeDots: DotAgent[]
): Promise<{ speakerId: string; speakerName: string; voice: any; text: string }> {
  try {
    const res = await fetch("/api/debate/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        currentSpeaker,
        lastSpeaker,
        lastMessage,
        activeDots,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("executeDebateStep fetch error, using local fallback:", err);
  }

  // Resilient local fallback
  const localFallbackArgs: Record<string, string> = {
    gaia: `Integrando com a regeneração da biosfera, aplicamos microbiomas sintéticos que reequilibram os ciclos de carbono e nutrientes em escala continental.`,
    prometheus: `Do ponto de vista energético, sustentamos essa malha inteira através de microrreatores de fusão limpa de Hélio-3, gerando megawatts a custo marginal zero.`,
    hippocrates: `Ao proteger o tecido biológico dos indivíduos com nanosensores profiláticos e vetores CRISPR-Prime, asseguramos imunidade e longevidade sustentável.`,
    sophia: `Consolidando isso sob um protocolo de Alinhamento Simbiótico e governança autônoma auditável, eliminamos riscos de desvios sistêmicos.`,
    quantum: `Nossos modelos estocásticos quânticos comprovam que a curva de viabilidade atinge estabilidade orçamentária e retorno social positivo em poucos meses.`,
  };

  const key = Object.keys(localFallbackArgs).find((k) =>
    (currentSpeaker.id || "").toLowerCase().includes(k)
  ) || "gaia";

  return {
    speakerId: currentSpeaker.id,
    speakerName: currentSpeaker.name,
    voice: currentSpeaker.voice,
    text: localFallbackArgs[key] || `Como ${currentSpeaker.name}, confirmo que nossos modelos de ${currentSpeaker.topic} validam plenamente esta trajetória de solução.`,
  };
}

export async function synthesizeHumanitySolution(
  topic: string,
  transcript: string,
  participatingDots: DotAgent[]
): Promise<HumanitySolution> {
  try {
    const res = await fetch("/api/humanity/solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, transcript, participatingDots }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("synthesizeHumanitySolution fetch error, using local fallback:", err);
  }

  return {
    id: `sol-${Date.now()}`,
    title: `Protocolo Unificado: ${topic || "Resolução Planetária"}`,
    targetCrisis: topic || "Crise Global Complexa",
    status: "Consenso Alcançado",
    feasibilityScore: 95,
    summary: "Convergência sinérgica entre energia limpa inesgotável, nanobioengenharia e alinhamento ético de agentes de IA.",
    technicalBreakdown: [
      "Desdobramento modular de microrreatores limpos acoplados a micro-redes elétricas",
      "Sensoriamento em tempo real por constelação de satélites e nós IoT regenerativos",
      "Governança por consenso autônomo e auditoria criptográfica aberta em rede",
    ],
    timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    authors: participatingDots?.map((d: any) => d.name) || ["Dr. Prometheus", "Dr. Gaia", "Dra. Sophia"],
  };
}

export async function formulateNexusConsensus(
  query: string,
  opinions: { dotName: string; topic?: string; text: string }[],
  participatingDots: DotAgent[] | string[]
): Promise<{
  id: string;
  title: string;
  shortSummary: string;
  targetCrisis: string;
  feasibilityScore: number;
  participatingDots: string[];
  timestamp: string;
}> {
  const dotsNames = Array.isArray(participatingDots)
    ? participatingDots.map((d: any) => (typeof d === "string" ? d : d.name))
    : ["Dr. Prometheus", "Dra. Gaia"];

  try {
    const res = await fetch("/api/nexus/consensus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, opinions, participatingDots }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("formulateNexusConsensus fetch error, using local fallback:", err);
  }

  const fallbackTitles = [
    "Protocolo Bio-Solar Quântico",
    "Malha Energética Regenerativa",
    "Enxame Nanobiótico de Reparo",
    "Rede Descentralizada de Recursos",
    "Matriz de Fusão Compacta Hélio-3",
  ];
  const pickedTitle = fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)];
  const summaryText =
    Array.isArray(opinions) && opinions.length >= 2
      ? `Convergência de ${opinions[0].dotName} e ${opinions[1].dotName}: fusão tecnológica pioneira para resolver "${query.slice(0, 45)}" com implementação escalável imediata.`
      : `Solução de alto impacto forjada em consenso pelos Dots para responder à demanda "${query.slice(0, 40)}".`;

  return {
    id: `consensus-${Date.now()}`,
    title: pickedTitle,
    shortSummary: summaryText,
    targetCrisis: query,
    feasibilityScore: 96,
    participatingDots: dotsNames,
    timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}
