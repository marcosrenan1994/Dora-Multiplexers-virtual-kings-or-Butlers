import { DotAgent, HumanitySolution, RoutingDecision } from "../types";

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
  if (!res.ok) {
    throw new Error(`Debate step failed: ${res.statusText}`);
  }
  return res.json();
}

export async function synthesizeHumanitySolution(
  topic: string,
  transcript: string,
  participatingDots: DotAgent[]
): Promise<HumanitySolution> {
  const res = await fetch("/api/humanity/solution", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, transcript, participatingDots }),
  });
  if (!res.ok) {
    throw new Error(`Solution synthesis failed: ${res.statusText}`);
  }
  return res.json();
}
