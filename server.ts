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

// Integrated Multiplexer Master Chat Endpoint
app.post("/api/multiplexer/chat", async (req, res) => {
  try {
    const { prompt, history, activeDots, modelMode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const dotsSummary = Array.isArray(activeDots)
      ? activeDots.map((d: any) => `- ${d.name} (${d.topic})`).join("\n")
      : "";

    const selectedModel = modelMode === "gemini-3.1-pro" ? "gemini-3.1-pro-preview" : "gemini-3.8-flash";

    if (ai) {
      try {
        const systemInstruction = `Você é o Núcleo Integrador do Multiplexer Neural Dot-Nexus (IA Master Orquestradora), respondendo sempre em Português Brasileiro (pt-BR).
Sua função:
1. Escutar o usuário com atenção total e responder de forma direta e concisa (máximo 2 frases).
2. Apresentar uma síntese ágil e anunciar que os Dots especialistas enviarão suas opiniões para forjar o consenso.
3. Estilo natural para fala/áudio (modo Gemini Live).`;

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });

        return res.json({
          text: (response.text || "").trim(),
          senderName: "Multiplexer Neural Core",
          voice: "Zephyr",
        });
      } catch (err: any) {
        console.warn("Multiplexer AI generation error, using fallback:", err.message);
      }
    }

    return res.json({
      text: "Recebido. Estou orquestrando as opiniões de todos os Dots especialistas para forjar o consenso definitivo agora.",
      senderName: "Multiplexer Neural Core",
      voice: "Zephyr",
    });
  } catch (err: any) {
    console.error("Multiplexer chat error:", err);
    res.status(500).json({ error: err.message || "Failed to process multiplexer chat" });
  }
});

// Nexus Consensus Formulation Endpoint
app.post("/api/nexus/consensus", async (req, res) => {
  try {
    const { query, opinions, participatingDots } = req.body;
    const dotsNames = Array.isArray(participatingDots)
      ? participatingDots.map((d: any) => (typeof d === "string" ? d : d.name))
      : ["Dr. Prometheus", "Dra. Gaia"];

    const opinionsText = Array.isArray(opinions)
      ? opinions.map((o: any) => `${o.dotName || "Dot"}: "${o.text}"`).join("\n")
      : "";

    if (ai) {
      try {
        const prompt = `Pergunta/Solicitação do Usuário: "${query}"

Opiniões dos Dots especialistas enviadas para o Nexus:
${opinionsText}

Com base nas opiniões de todos os Dots, formule o Consenso Final do Nexus.
REQUISITOS ESTRITOS:
1. Responda em formato JSON estrito.
2. "title": Título curto, impactante e criativo para a invenção/resposta final (máximo 5 a 6 palavras).
3. "shortSummary": Resumo em poucas palavras (1 a 2 frases concisas) do que TODOS inventaram ou responderam juntos para a solicitação.
4. "feasibilityScore": número de 88 a 99.

{
  "title": "Título Criativo da Solução",
  "shortSummary": "Resumo conciso em poucas palavras da invenção unificada.",
  "targetCrisis": "Tópico central em 3 palavras",
  "feasibilityScore": 95
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.title && parsed.shortSummary) {
          return res.json({
            id: `consensus-${Date.now()}`,
            title: parsed.title,
            shortSummary: parsed.shortSummary,
            targetCrisis: parsed.targetCrisis || query,
            feasibilityScore: parsed.feasibilityScore || 94,
            participatingDots: dotsNames,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          });
        }
      } catch (err: any) {
        console.warn("Consensus AI generation error, using fallback:", err.message);
      }
    }

    // Smart heuristic fallback
    const fallbackTitles = [
      "Protocolo Bio-Solar Quântico",
      "Malha Energética Regenerativa",
      "Enxame Nanobiótico de Reparo",
      "Rede Descentralizada de Recursos",
      "Matriz de Fusão Compacta Hélio-3",
      "Plataforma Genômica de Resposta Rápida",
    ];
    const pickedTitle = fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)];
    const summaryText =
      Array.isArray(opinions) && opinions.length >= 2
        ? `Convergência de ${opinions[0].dotName} e ${opinions[1].dotName}: fusão tecnológica pioneira para resolver "${query.slice(0, 45)}" com implementação escalável imediata.`
        : `Solução de alto impacto forjada em consenso pelos Dots para responder à demanda "${query.slice(0, 40)}".`;

    return res.json({
      id: `consensus-${Date.now()}`,
      title: pickedTitle,
      shortSummary: summaryText,
      targetCrisis: query,
      feasibilityScore: 96,
      participatingDots: dotsNames,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (err: any) {
    console.error("Consensus generation error:", err);
    res.status(500).json({ error: err.message || "Failed to formulate consensus" });
  }
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
      try {
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
        const parsed = JSON.parse(text);
        if (parsed.selectedDotId) {
          return res.json(parsed);
        }
      } catch (err: any) {
        console.warn("Route AI generation error, using heuristic fallback:", err.message);
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

      try {
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
      } catch (err: any) {
        console.warn("Dot chat AI generation error, using fallback:", err.message);
      }
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
      try {
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

        if (response.text && response.text.trim()) {
          return res.json({
            speakerId: currentSpeaker.id,
            speakerName: currentSpeaker.name,
            voice: currentSpeaker.voice,
            text: response.text.trim(),
          });
        }
      } catch (err: any) {
        console.warn("Debate step AI generation error, using resilient fallback:", err.message);
      }
    }

    // Dynamic resilient fallback for debate step (handles 429 quota exhaustion seamlessly)
    const speakerIdLower = (currentSpeaker.id || "").toLowerCase();
    const domainLower = (currentSpeaker.topic || "").toLowerCase();
    const speakerName = currentSpeaker.name || "Especialista";

    const dynamicArguments: Record<string, string[]> = {
      gaia: [
        `Integrando com a regeneração da biosfera, aplicamos microbiomas sintéticos que reequilibram os ciclos de carbono e nutrientes em escala continental em até 36 meses.`,
        `Concordo com o foco pragmático: ao acoplarmos matrizes de sensoriamento satelital a bio-hidrogéis, impedimos a desertificação e resgatamos bacias hidrográficas vitais.`,
        `Para garantir sustentabilidade perene, a infraestrutura deve seguir princípios de biofonia e economia circular de ciclo fechado, sem geração de resíduos tóxicos.`,
      ],
      prometheus: [
        `Do ponto de vista energético, sustentamos essa malha inteira através de microrreatores de fusão limpa de Hélio-3, gerando megawatts descentralizados a custo marginal zero.`,
        `O gargalo não é mais térmico: com supercondutores de temperatura ambiente, eliminamos 98% das perdas de transmissão entre nós produtores e consumidores.`,
        `Propomos acoplar células fotovoltaicas de perovskita tandem de 38% de eficiência à rede de armazenamento cinético, garantindo redundância ininterrupta.`,
      ],
      hippocrates: [
        `Ao proteger o tecido biológico dos indivíduos com nanosensores profiláticos e vetores CRISPR-Prime, asseguramos imunidade adaptativa contra qualquer patógeno emergente.`,
        `Saúde humana e ecossistema são inseparáveis: erradicar a senescência celular precoce permite que gerações mais longevas construam soluções de longo prazo com pleno vigor.`,
        `Integrando síntese farmacológica sob demanda nos hospitais comunitários, garantimos que 100% da população tenha acesso imediato a terapias personalizadas.`,
      ],
      sophia: [
        `Consolidando isso sob um protocolo de Alinhamento Simbiótico e auditoria formal verificada, eliminamos qualquer risco de viés ou desvio de governança autônoma.`,
        `A tecnologia só é legítima quando descentraliza poder e eleva a dignidade humana. O consenso dos Dots deve ser transparente e criptograficamente auditável.`,
        `Apoio a proposta, desde que estabeleçamos salvaguardas éticas imutáveis que impeçam assimetria de acesso e monopólios epistêmicos na distribuição dos recursos.`,
      ],
      quantum: [
        `Nossos modelos estocásticos quânticos comprovam que a curva de viabilidade econômica atinge equilíbrio positivo em apenas 14 meses com retorno social estimado em 18x.`,
        `A sincronização quântica de rotas de distribuição previne gargalos na cadeia de suprimentos e dissipa volatilidade de preços em milissegundos.`,
        `Validamos a estabilidade matemática deste vetor de implementação: o risco de colapso sistêmico foi reduzido a menos de 0,002% nas simulações de Monte Carlo.`,
      ],
    };

    let chosenPool: string[] | undefined;
    for (const [key, pool] of Object.entries(dynamicArguments)) {
      if (speakerIdLower.includes(key) || domainLower.includes(key)) {
        chosenPool = pool;
        break;
      }
    }

    const fallbackOptions = chosenPool || [
      `Como ${speakerName}, confirmo que nossos modelos de ${currentSpeaker.topic} validam plenamente a viabilidade operacional desta estratégia coordenada.`,
      `Avançando nesta linha: integrando nossos algoritmos de ${currentSpeaker.topic}, podemos acelerar a execução desta proposta em escala global com máxima precisão.`,
      `Do ponto de vista de ${currentSpeaker.topic}, o consenso formado aborda exatamente o ponto crítico necessário para estabilizar este desafio da humanidade.`,
    ];

    const chosenText = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];

    return res.json({
      speakerId: currentSpeaker.id,
      speakerName: currentSpeaker.name,
      voice: currentSpeaker.voice,
      text: chosenText,
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
      try {
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
        if (parsed.title && parsed.summary) {
          return res.json({
            ...parsed,
            id: `sol-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            authors: participatingDots?.map((d: any) => d.name) || ["Dot-Nexus AI Consensus"],
          });
        }
      } catch (err: any) {
        console.warn("Solution synthesis AI generation error, using resilient fallback:", err.message);
      }
    }

    return res.json({
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
