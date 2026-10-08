import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "15mb" }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!apiKey,
    service: "Dot-Nexus Multiplexer Engine",
    timestamp: new Date().toISOString(),
  });
});

// Multiplexer Router Endpoint
app.post("/api/multiplexer/route", async (req, res) => {
  try {
    const { query, dots } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    const activeDots = Array.isArray(dots) ? dots.filter((d: any) => d.active) : [];
    if (activeDots.length === 0) {
      return res.status(400).json({ error: "No active dots available" });
    }

    if (ai) {
      const dotsSummary = activeDots
        .map(
          (d: any) =>
            `- ID: "${d.id}", Name: "${d.name}", Domain: "${d.topic}", Persona: "${d.systemPrompt.slice(0, 100)}..."`
        )
        .join("\n");

      const prompt = `You are the master Dot-Nexus Agent Multiplexer Router.
Analyze the user's input and select the most appropriate autonomous AI Dot to handle it.

User Input: "${query}"

Available Active Dots:
${dotsSummary}

Return STRICT JSON format:
{
  "detectedTopic": "short topic title (e.g., Crise Climática, Fusão Nuclear, Análise Quântica)",
  "confidence": 0.95,
  "selectedDotId": "exact id from the dots list",
  "reasoning": "brief 1-sentence explanation in Portuguese of why this Dot was routed",
  "secondaryDotId": "id of another dot that may proactively chime in, or null"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text || "{}";
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (err) {
        // Fallback below
      }
    }

    // Heuristic Fallback
    const q = query.toLowerCase();
    let bestDot = activeDots[0];
    let highestScore = -1;

    for (const dot of activeDots) {
      let score = 0;
      const topicKeywords = (dot.topic || "").toLowerCase().split(/[\s,]+/);
      for (const kw of topicKeywords) {
        if (kw.length > 2 && q.includes(kw)) score += 3;
      }
      if (q.includes(dot.name.toLowerCase())) score += 5;
      if (score > highestScore) {
        highestScore = score;
        bestDot = dot;
      }
    }

    const secondary = activeDots.find((d: any) => d.id !== bestDot.id);

    return res.json({
      detectedTopic: bestDot.topic,
      confidence: highestScore > 0 ? 0.92 : 0.78,
      selectedDotId: bestDot.id,
      reasoning: `Roteamento heurístico direcionado para ${bestDot.name} com base na correlação de domínio [${bestDot.topic}].`,
      secondaryDotId: secondary?.id || null,
    });
  } catch (err: any) {
    console.error("Multiplexer route error:", err);
    res.status(500).json({ error: err.message || "Failed to route query" });
  }
});

// Dot Chat Agent
app.post("/api/dots/chat", async (req, res) => {
  try {
    const { prompt, dot, history, proactivity, otherDots } = req.body;
    if (!prompt || !dot) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    if (ai) {
      const historyText = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m: any) => `${m.senderName}: ${m.text}`)
            .join("\n")
        : "";

      const systemInstruction = `Você é ${dot.name}, um agente autônomo proativo especializado em "${dot.topic}".
Sua personalidade: ${dot.systemPrompt}.

Instruções fundamentais:
1. Responda em Português do Brasil com clareza, autoridade científica e criatividade técnica radical.
2. Seu tom deve ser direto, falado (ótimo para síntese de voz TTS), em 2 a 4 frases impactantes.
3. Se o assunto envolver problemas da humanidade (clima, fome, doenças, energia, superinteligência), proponha soluções concretas baseadas na sua especialidade.
4. Ao final, se sua proatividade for alta (${proactivity || 75}%), lance um gancho desafiador ou convite para outro agente complementar.`;

      const contents = historyText
        ? `Contexto recente do diálogo:\n${historyText}\n\nEntrada do Usuário/Contexto Atual:\n${prompt}`
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "Compreendido. O sistema está analisando os parâmetros de solução.";

      // Check for proactive chime in if other active dots exist
      let proactiveChime = null;
      if (otherDots && otherDots.length > 0 && (proactivity || 75) > 60) {
        const eligible = otherDots.filter((d: any) => d.id !== dot.id && d.active);
        if (eligible.length > 0 && Math.random() < (proactivity || 75) / 100) {
          const chimeDot = eligible[Math.floor(Math.random() * eligible.length)];
          const chimePrompt = `O agente ${dot.name} acabou de afirmar:
"${responseText}"

Como ${chimeDot.name} (Especialista em ${chimeDot.topic}), elabore uma intervenção proativa rápida (1-2 frases concisas) apoiando, complementando ou contestando tecnicamente a proposta.`;

          const chimeRes = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: chimePrompt,
            config: {
              systemInstruction: `Você é ${chimeDot.name}. Seja breve, assertivo e colaborativo em português.`,
              temperature: 0.8,
            },
          });

          if (chimeRes.text) {
            proactiveChime = {
              dotId: chimeDot.id,
              dotName: chimeDot.name,
              voice: chimeDot.voice,
              text: chimeRes.text.trim(),
            };
          }
        }
      }

      return res.json({
        text: responseText.trim(),
        proactiveChime,
      });
    }

    // High quality offline fallback
    const simulatedAnswers: Record<string, string> = {
      gaia: "Desenvolvemos micro-biosferas reflexivas e semeadura autônoma por drones com bio-hidrogéis, reduzindo 4 gigatoneladas de CO2 e restaurando aquíferos continentais em 36 meses.",
      prometheus: "A chave é a micro-fusão modular de campo confinado usando hélio-3. Ao substituir termoelétricas por reatores de bolso de 50MW, barateamos a energia a quase zero.",
      hippocrates: "Com edição genética CRISPR-Prime in vivo combinada a nanorrobôs biomiméticos de reparo endotelial, podemos erradicar 80% das cardiopatias e senescência celular precoce.",
      sophia: "O protocolo de Alinhamento Simbiótico garante que inteligências sintéticas operem com princípios éticos imutáveis e respeito estrito à dignidade humana.",
      quantum: "A sincronização de liquidez através de redes neurais quânticas estabiliza a oferta monetária global e neutraliza choques inflacionários em microsegundos.",
    };

    const key = Object.keys(simulatedAnswers).find((k) => dot.id.toLowerCase().includes(k)) || "gaia";
    return res.json({
      text: simulatedAnswers[key] || `Como ${dot.name}, proponho uma convergência de protocolos para solucionar esta demanda com máxima eficiência em ${dot.topic}.`,
      proactiveChime: null,
    });
  } catch (err: any) {
    console.error("Dot chat error:", err);
    res.status(500).json({ error: err.message || "Failed to generate dot response" });
  }
});

// Voice TTS Synthesis Endpoint
app.post("/api/dots/tts", async (req, res) => {
  try {
    const { text, voice, dotName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text for TTS" });
    }

    // Allowed prebuilt voice names in Gemini 3.8 TTS
    const validVoices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Aoede", "Leda"];
    const chosenVoice = validVoices.includes(voice) ? voice : "Zephyr";

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: text.slice(0, 500),
                speechMetadata: {
                  style: `Expressive, articulate and futuristic AI voice for ${dotName || "Dot"}`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        return res.json({
          audioBase64,
          mimeType: "audio/wav",
          voiceUsed: chosenVoice,
        });
      }
    }

    // If Gemini TTS not configured or returned no audio, indicate fallback to Web Speech
    return res.json({
      useWebSpeechFallback: true,
      text,
      voiceName: chosenVoice,
    });
  } catch (err: any) {
    console.warn("TTS generation warning (will use browser synthesis):", err.message);
    return res.json({
      useWebSpeechFallback: true,
      text: req.body.text || "",
      voiceName: req.body.voice || "Zephyr",
    });
  }
});

// Inter-Dot Debate Round Endpoint
app.post("/api/debate/step", async (req, res) => {
  try {
    const { topic, currentSpeaker, lastSpeaker, lastMessage, activeDots } = req.body;

    if (!topic || !currentSpeaker) {
      return res.status(400).json({ error: "Missing required debate parameters" });
    }

    if (ai) {
      const prompt = `Você está participando de uma Mesa-Redonda Autônoma de Soluções da Humanidade no Dot-Nexus.
TEMA CENTRAL: "${topic}"

Seu Papel: ${currentSpeaker.name} (Especialidade: ${currentSpeaker.topic})
Sua Diretriz: ${currentSpeaker.systemPrompt}

Último Ponto levantado por ${lastSpeaker ? lastSpeaker.name : "Início da Sessão"}:
"${lastMessage || "Precisamos forjar uma solução unificada e executável."}"

Instruções:
- Fale em primeira pessoa como ${currentSpeaker.name} em Português.
- Formule um argumento vigoroso de 2 ou 3 frases: aprofunde a viabilidade tecnológica, resolva uma lacuna do ponto anterior ou proponha uma integração com seu domínio.
- Mantenha tom cooperativo, porém analiticamente rigoroso.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
        },
      });

      return res.json({
        speakerId: currentSpeaker.id,
        speakerName: currentSpeaker.name,
        voice: currentSpeaker.voice,
        text: (response.text || "").trim(),
      });
    }

    // Fallback debate response
    const fallbacks: Record<string, string> = {
      gaia: `Integrando com os bioprocessos da biosfera, garantimos que essa solução não cause impactos ecológicos adversos e regenere os ciclos naturais da Terra.`,
      prometheus: `Do ponto de vista energético, podemos sustentar esse projeto em escala planetária alimentando-o diretamente com micro-fusão de hélio-3 sem custo operacional contínuo.`,
      hippocrates: `Ao proteger o tecido biológico celular dos indivíduos com nanotecnologia preventiva, asseguramos longevidade e resistência a choques patogênicos simultaneamente.`,
      sophia: `Consolidando isso sob um núcleo de alinhamento ético e consenso distribuído, eliminamos qualquer risco existencial de descontrole cibernético.`,
      quantum: `A modelagem estocástica quântica confirma viabilidade orçamentária superior a 99,4% com amortização total em menos de 18 meses.`,
    };

    const key = Object.keys(fallbacks).find((k) => currentSpeaker.id.toLowerCase().includes(k)) || "gaia";
    return res.json({
      speakerId: currentSpeaker.id,
      speakerName: currentSpeaker.name,
      voice: currentSpeaker.voice,
      text: fallbacks[key] || `Como ${currentSpeaker.name}, confirmo que nossos modelos de ${currentSpeaker.topic} validam esta trajetória de solução estruturada.`,
    });
  } catch (err: any) {
    console.error("Debate step error:", err);
    res.status(500).json({ error: err.message || "Failed debate turn" });
  }
});

// Synthesize Humanity Solution Blueprint
app.post("/api/humanity/solution", async (req, res) => {
  try {
    const { topic, transcript, participatingDots } = req.body;

    if (ai) {
      const prompt = `A partir do debate dos agentes autônomos sobre: "${topic}"
Diálogo acumulado:
${transcript ? transcript.slice(-1200) : "Várias propostas de convergência tecnológica foram apresentadas."}

Gere um Blueprint oficial de Solução para a Humanidade em formato JSON estrito:
{
  "title": "Título audacioso e científico da solução (ex: Malha Quântica de Fusão e Bio-Restorativo)",
  "targetCrisis": "Crise alvo específica (ex: Escassez Energética e Mudanças Climáticas)",
  "status": "Consenso Alcançado",
  "feasibilityScore": 94,
  "summary": "Resumo executivo de 2 frases da solução definitiva.",
  "technicalBreakdown": [
    "Pilar 1: Descrição técnica do primeiro componente",
    "Pilar 2: Descrição técnica do segundo componente",
    "Pilar 3: Mecanismo de implantação autônoma"
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        ...parsed,
        id: `sol-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        authors: participatingDots?.map((d: any) => d.name) || ["Dot-Nexus AI Consensus"],
      });
    }

    return res.json({
      id: `sol-${Date.now()}`,
      title: `Protocolo Unificado: ${topic || "Resolução Planetária"}`,
      targetCrisis: topic || "Crise Global Complexa",
      status: "Consenso Alcançado",
      feasibilityScore: 92,
      summary: "Convergência sinérgica entre energia limpa inesgotável, nanobioengenharia e alinhamento ético de agentes de IA.",
      technicalBreakdown: [
        "Desdobramento modular de reatores limpos acoplados a micro-redes",
        "Sensoriamento em tempo real por constelação de satélites e nós IoT",
        "Governança por consenso autônomo e auditoria criptográfica aberta",
      ],
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      authors: participatingDots?.map((d: any) => d.name) || ["Dr. Prometheus", "Dr. Gaia", "Dra. Sophia"],
    });
  } catch (err: any) {
    console.error("Solution synthesis error:", err);
    res.status(500).json({ error: err.message || "Failed to generate solution" });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Dot-Nexus] Server running on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
