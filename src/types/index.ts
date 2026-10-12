export type VoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Leda';

export type OrchestrationMode = 'multiplexer_integrated' | 'direct_specialist';
export type ModelMode = 'gemini-3.8-live' | 'gemini-3.1-pro' | 'gemini-flash-lite';

export interface DotAgent {
  id: string;
  name: string;
  topic: string;
  category: 'humanity' | 'science' | 'finance' | 'philosophy' | 'custom';
  voice: VoiceName;
  color: string;
  accentBg: string;
  icon: string;
  systemPrompt: string;
  active: boolean;
  proactivity: number; // 0 to 100
  status: 'idle' | 'analyzing' | 'speaking' | 'debating';
  stats: {
    responsesCount: number;
    solutionsCount: number;
    confidenceAvg: number;
  };
}

export interface NexusConsensus {
  id: string;
  title: string;
  shortSummary: string;
  targetCrisis?: string;
  participatingDots: string[];
  timestamp: string;
  feasibilityScore?: number;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  senderType: 'user' | 'dot' | 'system' | 'router' | 'multiplexer';
  senderDotId?: string;
  senderName: string;
  text: string;
  audioUrl?: string;
  topicTag?: string;
  routedBy?: string;
  reasoning?: string;
  isProactiveChime?: boolean;
  voiceName?: VoiceName;
  isConsensus?: boolean;
  consensus?: NexusConsensus;
  opinionTarget?: string;
}

export interface RoutingDecision {
  detectedTopic: string;
  confidence: number;
  selectedDotId: string;
  reasoning: string;
  secondaryDotId?: string | null;
}

export interface HumanitySolution {
  id: string;
  title: string;
  targetCrisis: string;
  status: 'Proposta' | 'Em Validação' | 'Consenso Alcançado' | 'Pronto para Ação';
  feasibilityScore: number;
  summary: string;
  technicalBreakdown: string[];
  timestamp: string;
  authors: string[];
  upvotes?: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  level: 'info' | 'router' | 'voice' | 'debate' | 'solution';
  message: string;
}
