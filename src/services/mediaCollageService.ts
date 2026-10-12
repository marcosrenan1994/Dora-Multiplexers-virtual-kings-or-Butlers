import { ChatMessage, HumanitySolution, VideoStoryboardScene, DotAgent, VideoFrame } from "../types";

export interface AutobotRadioSnippet {
  id: string;
  text: string;
  frequency: string;
  stationName: string;
  pitch: number;
  rate: number;
  effectType: 'static_burst' | 'tuning_chirp' | 'morse_click' | 'squelch';
}

export interface StoryboardNarrativeStep {
  stageName: string;
  caption: string;
  visualConcept: string;
  subPrompt: string;
  imageUrl: string;
}

// Coherent, sequential narrative banks (each bank contains 6 continuous stages of the SAME story)
const COHERENT_NARRATIVE_BANKS: Record<string, StoryboardNarrativeStep[]> = {
  professions_swarm: [
    {
      stageName: "Ato 01 • Mesa Redonda Autobot",
      caption: "Conferência Tática: Dots 1 a 8 reunidos deliberando a elevação das profissões humanas",
      visualConcept: "Mesa redonda holográfica dos Autobots com os Dots projetando o planeta Terra ao centro",
      subPrompt: "futuristic Autobot command center round table conference, holographic glowing blue Earth hologram at center, robotic specialist agents seated around table deliberating, cinematic 16:9, highly detailed, moody sci-fi lighting",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 02 • Engenharia de Código Universal (Dot 7)",
      caption: "Dot 7 gerando código unificado para Windows, Android e Supercomputadores Quânticos",
      visualConcept: "Linhas de código luminosas, arquitetura de sistemas operacionais e transição quântica",
      subPrompt: "cyberpunk quantum programmer workstation, holographic code streams spanning Windows desktop interface, Android smartphone schemas, and quantum computer qubit matrix, 16:9 cinematic render",
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 03 • Ignição do Enxame Quântico (7x Hiper-Inteligência)",
      caption: "Processador Quântico ativando enxame com capacidade cognitiva 7x superior ao cérebro humano coletivo",
      visualConcept: "Reator quântico de nós neurais interligados com feixes de laser e supercondutores",
      subPrompt: "quantum computer core reactor with glowing golden and cyan laser lattices, thousands of interconnected neural nodes pulsing with extreme intelligence, 16:9 photorealistic concept art",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 04 • Malha de 10 Bilhões de Especialistas (Dot 8)",
      caption: "Dot 8 orquestrando 10 bilhões de IAs especialistas em todas as profissões da história",
      visualConcept: "Mosaico estelar global mapeando médicos, engenheiros, agricultores, artesãos e educadores",
      subPrompt: "global holographic network matrix showing billions of specialized avatar nodes representing all historical human professions, doctors, teachers, engineers, farmers, artisans, 16:9 ultra-detailed",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 05 • O Trabalho Humano Elevado no Mundo Real",
      caption: "Profissionais no campo, indústrias e laboratórios potencializados pelo enxame de Dots",
      visualConcept: "Trabalhadores humanos com óculos e ferramentas de assistência inteligentes em harmonia e segurança",
      subPrompt: "human workers in diverse professions working with serene focus augmented by warm holographic AI aids, farming high-tech crops, hospital surgeons, craftsmen, harmonious future labor, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 06 • Prosperidade Planetária & Conquista da Terra",
      caption: "Planeta Terra próspero, pleno emprego criativo, dignidade laboral e regeneração ecológica global",
      visualConcept: "Cidades sustentáveis com céu limpo, comunidades integradas e celebração do avanço humano",
      subPrompt: "magnificent sustainable futuristic Earth metropolis integrated with lush green nature, clean rivers, happy thriving human society, golden hour cinematic lighting, 16:9 masterpiece",
      imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  energy: [
    {
      stageName: "Ato 01 • Mesa Redonda: Diagnóstico Energético",
      caption: "Dots analisando gargalos fósseis e modelando matriz de fusão Hélio-3",
      visualConcept: "Sala de comando com telemetria global da rede elétrica e emissões",
      subPrompt: "Autobot conference room evaluating planetary energy grid on holographic spherical monitors, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 02 • Blueprint do Microrreator de Fusão",
      caption: "Esquema técnico com ímãs supercondutores cerâmicos e confinamento magnético",
      visualConcept: "Holograma 3D do reator compacto de fusão em corte esquemático",
      subPrompt: "holographic blueprint schematic of compact helium-3 fusion tokamak reactor, technical drawing, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 03 • Ignição do Plasma Estelar",
      caption: "Reação sustentada de fusão sem queima de combustíveis nem radiação residual",
      visualConcept: "Plasma incandescente azul e dourado confinado em campo magnético perfeito",
      subPrompt: "stellar glowing fusion plasma contained within high-tech magnetic ring, kinetic plasma energy, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 04 • Malha de Distribuição Supercondutora",
      caption: "Microestações urbanas distribuindo eletricidade a custo marginal zero",
      visualConcept: "Rede subterrânea de cabos supercondutores interligando indústrias e cidades",
      subPrompt: "futuristic power substation with superconducting ceramic cables glowing neon cyan, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 05 • Eletricistas e Engenheiros Empoderados",
      caption: "Operários e técnicos gerenciando a transição com inteligência preditiva dos Dots",
      visualConcept: "Trabalhadores da energia operando consoles holográficos com segurança total",
      subPrompt: "electrical engineers smiling as they monitor automated zero-carbon power grids with augmented tablets, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 06 • Civilização Descarbonizada e Iluminada",
      caption: "Fim da escassez energética mundial e ar puro em todas as metrópoles",
      visualConcept: "Horizonte planetário limpo com energia abundante para todas as nações",
      subPrompt: "clean glittering eco-city at twilight powered by limitless green fusion energy, pure atmosphere, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  water_climate: [
    {
      stageName: "Ato 01 • Mesa Redonda: Emergência Hídrica",
      caption: "Dots avaliando bacias hidrográficas e secas extremas no semiárido e desertos",
      visualConcept: "Holograma de bacias secas e plano de condensação atmosférica",
      subPrompt: "Autobot conference room examining desert drought maps on glowing holographic display, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 02 • Engenharia Molecular de Grafeno Biomimético",
      caption: "Estrutura inspirada no besouro do deserto para extrair vapor do ar com zero energia",
      visualConcept: "Malha de grafeno microscópica com gotas de orvalho cristalinas",
      subPrompt: "biomimetic graphene nanonet structure capturing atmospheric moisture droplets, high-tech microscope, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 03 • Instalação dos Coletores em Grande Escala",
      caption: "Módulos automatizados instalados em dunas e áreas áridas colhendo água potável",
      visualConcept: "Torres solares estéticas gerando rios artificiais límpidos no deserto",
      subPrompt: "architectural solar moisture collector arrays installed across vast desert sands, producing pure water, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 04 • Rede Hídrica Subterrânea Descentralizada",
      caption: "Tubulações refrigeradas levando água mineralizada para vilarejos e plantações",
      visualConcept: "Aquedutos modernos irrigando hectares de culturas sustentáveis",
      subPrompt: "futuristic clean water pipeline irrigation canals transforming arid land into fertile green oasis, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 05 • Agricultores e Comunidades Prósperas",
      caption: "Produtores rurais cultivando alimentos abundantes com água pura e apoio dos Dots",
      visualConcept: "Famílias e agricultores colhendo alimentos frescos em campos revitalizados",
      subPrompt: "farmers in flourishing green fields inspecting fresh organic produce with robotic helper drones, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 06 • Biosfera Planetária Plenamente Restaurada",
      caption: "Erradicação da sede e renascimento verde de ecossistemas continentais",
      visualConcept: "Paisagem planetária exuberante com rios vivos e equilíbrio climático",
      subPrompt: "pristine crystal river flowing through lush valleys and reforested mountains, blue skies, paradise, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  health: [
    {
      stageName: "Ato 01 • Mesa Redonda: Alinhamento Genômico",
      caption: "Dots sintetizando dados moleculares para erradicação de patógenos e doenças crônicas",
      visualConcept: "Comando Autobot com projeção de dupla hélice de DNA holográfica",
      subPrompt: "Autobot command round table analyzing human genome hologram with medical telemetric readouts, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 02 • Plataforma CRISPR-Prime Molecular",
      caption: "Edição genética de precisão sem quebra de fita dupla e sem efeitos colaterais",
      visualConcept: "Nanocápsulas lipídicas guiando reparação celular em nível atômico",
      subPrompt: "molecular 3D illustration of CRISPR-Prime nanorobotic capsule repairing DNA strand, glowing turquoise, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1579165466791-78822d31e672?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 03 • Vigilância e Nanossensores Preventivos",
      caption: "Detecção precoce instantânea de anomalias celulares em estágio zero",
      visualConcept: "Interface de biotelemetria monitorando células e restaurando a homeostase",
      subPrompt: "futuristic medical laboratory scanning live cellular biological processes on transparent glass screens, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 04 • Produção Acelerada de Terapias Universais",
      caption: "Biorreatores modulares fabricando terapias genéticas acessíveis a todos os países",
      visualConcept: "Complexo de síntese automatizada com robôs e supervisão ética de Dot 4",
      subPrompt: "automated clinical bioreactor facility manufacturing universal gene therapeutics, ultra-clean sci-fi, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 05 • Médicos e Profissionais de Saúde Amplificados",
      caption: "Equipes médicas curando pacientes com diagnósticos exatos e tratamentos indolores",
      visualConcept: "Médicos e enfermeiros em hospital do futuro cuidando de pessoas com calma e compaixão",
      subPrompt: "compassionate doctors and nurses using holographic AI diagnostics to heal patients in modern hospital, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1280&q=80",
    },
    {
      stageName: "Ato 06 • Humanidade Longeva, Saudável e Vibrante",
      caption: "População livre de doenças congênitas, vivendo com vitalidade e dignidade plena",
      visualConcept: "Pessoas de várias gerações ativas ao ar livre desfrutando da vida e do conhecimento",
      subPrompt: "healthy, joyful multigenerational families enjoying vibrant active life in sunny park, bright future, 16:9",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1280&q=80",
    },
  ],
};

const AUTOBOT_STATIONS = [
  { freq: "89.3 MHz", name: "Estação Alfa [Transmissão Tática Autobot]", pitch: 1.25, rate: 1.15 },
  { freq: "94.7 MHz", name: "Rádio Noticiário Retrô [Ondas Curtas AM]", pitch: 0.85, rate: 1.0 },
  { freq: "101.2 MHz", name: "Deep Space Comms [Frequência Quântica]", pitch: 1.4, rate: 1.1 },
  { freq: "105.8 MHz", name: "Canal Militar de Emergência [Walkie-Talkie]", pitch: 0.75, rate: 0.95 },
  { freq: "107.9 MHz", name: "Sintetizador Neural Nexus [Voz Holográfica]", pitch: 1.15, rate: 1.05 },
];

export class MediaCollageService {
  /**
   * Generates a free AI illustration URL using Pollinations AI (free, public API, no key required)
   * Anchors style to cinematic Autobot command table and narrative continuity
   */
  public generateImageUrl(prompt: string, seed: number = 42): string {
    const cleanPrompt = `cinematic 16:9 cyberpunk sci-fi futuristic concept art, 8k resolution, photorealistic, high-tech hologram HUD overlay, Autobot command aesthetics, ${prompt.slice(0, 160)}`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=576&nologo=true&seed=${seed}`;
  }

  /**
   * Detects the best coherent narrative bank for a given text/topic
   */
  public detectNarrativeBank(topicOrText: string): StoryboardNarrativeStep[] {
    const t = (topicOrText || "").toLowerCase();

    if (t.includes("profissão") || t.includes("trabalho") || t.includes("programador") || t.includes("software") || t.includes("windows") || t.includes("android") || t.includes("quântic") || t.includes("enxame") || t.includes("10 bilh") || t.includes("dot 7") || t.includes("dot 8") || t.includes("humano")) {
      return COHERENT_NARRATIVE_BANKS.professions_swarm;
    }
    if (t.includes("energia") || t.includes("fusão") || t.includes("solar") || t.includes("bateria") || t.includes("elétrica") || t.includes("reator")) {
      return COHERENT_NARRATIVE_BANKS.energy;
    }
    if (t.includes("água") || t.includes("saara") || t.includes("clima") || t.includes("seca") || t.includes("bio") || t.includes("deserto")) {
      return COHERENT_NARRATIVE_BANKS.water_climate;
    }
    if (t.includes("saúde") || t.includes("célula") || t.includes("vida") || t.includes("envelhecimento") || t.includes("crispr") || t.includes("cura")) {
      return COHERENT_NARRATIVE_BANKS.health;
    }

    // Default to the flagship professions & quantum swarm bank
    return COHERENT_NARRATIVE_BANKS.professions_swarm;
  }

  /**
   * Generates a strictly coherent sequence of progressive visual frames for a scene
   * so they form a continuous connected story about the same topic.
   */
  public generateFramesForScene(
    basePrompt: string,
    seed: number,
    text: string,
    title: string
  ): VideoFrame[] {
    const narrativeBank = this.detectNarrativeBank(text + " " + title + " " + basePrompt);

    return narrativeBank.map((step, fIdx) => {
      const frameSeed = seed + (fIdx * 137);
      const combinedPrompt = `${basePrompt}, ${step.subPrompt}`;
      return {
        id: `frm-${fIdx}-${frameSeed}`,
        frameIndex: fIdx,
        url: this.generateImageUrl(combinedPrompt, frameSeed),
        fallbackUrl: step.imageUrl,
        caption: `${title} • ${step.caption}`,
        stageName: step.stageName,
        timestampOffset: fIdx * 2.5,
      };
    });
  }

  /**
   * Builds an explicit bespoke Coherent Mission Video for the grand objective of humanity
   */
  public generateCoherentMissionVideo(
    objectiveTitle: string = "Enxame Quântico de 10 Bilhões de Especialistas para Todas as Profissões",
    objectiveDesc: string = "Plataforma de software multiplataforma universal interconectando Windows, smartphones Android e supercomputadores quânticos para elevar e potencializar todas as profissões da Terra.",
    authorDots: DotAgent[] = []
  ): VideoStoryboardScene {
    const seed = 777;
    const station = AUTOBOT_STATIONS[0];
    const frames = this.generateFramesForScene(
      "Autobot round table conference, universal code on Windows Android and quantum computing, 10 billion specialized AIs elevating all human professions on Earth",
      seed,
      "profissão software windows android quântico enxame 10 bilhões",
      objectiveTitle
    );

    const authorsList = authorDots.length > 0
      ? authorDots.map((d) => d.name).join(" & ")
      : "Dot 7 & Dot 8 & Multiplexer Core";

    return {
      id: `scene-mission-${Date.now()}`,
      title: objectiveTitle,
      sourceText: `${objectiveTitle}: ${objectiveDesc}`,
      authorName: authorsList,
      authorVoice: "Aoede",
      imageUrl: frames[0]?.url || this.generateImageUrl("Autobot round table", seed),
      fallbackImageUrl: frames[0]?.fallbackUrl || COHERENT_NARRATIVE_BANKS.professions_swarm[0].imageUrl,
      frames,
      imagePrompt: "Autobot command round table 10 billion AIs for human professions",
      category: "solution",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      radioStationFreq: station.freq,
      radioStationLabel: station.name,
    };
  }

  /**
   * Generates a storyboard scene from a ChatMessage with narrative continuity
   */
  public createSceneFromMessage(msg: ChatMessage, index: number = 0): VideoStoryboardScene {
    const seed = Math.abs(msg.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), index * 37));
    const station = AUTOBOT_STATIONS[index % AUTOBOT_STATIONS.length];

    let category: VideoStoryboardScene["category"] = "opinion";
    if (msg.isConsensus) category = "consensus";
    else if (msg.senderType === "user") category = "user";
    else if (msg.senderType === "system") category = "system";

    const promptText = msg.isConsensus && msg.consensus
      ? `${msg.consensus.title}, ${msg.consensus.shortSummary}`
      : `${msg.senderName} round table proposal: ${msg.text.slice(0, 100)}`;

    const title = msg.isConsensus && msg.consensus ? msg.consensus.title : `${msg.senderName}: Deliberação na Mesa Redonda`;
    const frames = this.generateFramesForScene(promptText, seed, msg.text, title);

    return {
      id: `scene-${msg.id}`,
      title,
      sourceText: msg.text,
      authorName: msg.senderName,
      authorDotId: msg.senderDotId,
      authorVoice: msg.voiceName || "Zephyr",
      imageUrl: frames[0]?.url || this.generateImageUrl(promptText, seed),
      fallbackImageUrl: frames[0]?.fallbackUrl || frames[0]?.url,
      frames,
      imagePrompt: promptText,
      category,
      timestamp: msg.timestamp,
      radioStationFreq: station.freq,
      radioStationLabel: station.name,
    };
  }

  /**
   * Generates a storyboard scene from a HumanitySolution with narrative continuity
   */
  public createSceneFromSolution(sol: HumanitySolution, index: number = 0): VideoStoryboardScene {
    const seed = Math.abs(sol.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), (index + 1) * 73));
    const station = AUTOBOT_STATIONS[(index + 2) % AUTOBOT_STATIONS.length];

    const promptText = `${sol.title}, ${sol.targetCrisis}, futuristic humanity invention`;
    const frames = this.generateFramesForScene(promptText, seed, sol.title + " " + sol.targetCrisis, sol.title);

    return {
      id: `scene-${sol.id}`,
      title: sol.title,
      sourceText: `${sol.title}. ${sol.summary}. Pilares: ${sol.technicalBreakdown.join(". ")}`,
      authorName: sol.authors.join(" & "),
      imageUrl: frames[0]?.url || this.generateImageUrl(promptText, seed),
      fallbackImageUrl: frames[0]?.fallbackUrl || frames[0]?.url,
      frames,
      imagePrompt: promptText,
      category: "solution",
      timestamp: sol.timestamp,
      radioStationFreq: station.freq,
      radioStationLabel: station.name,
    };
  }

  /**
   * Builds the complete sequential storyboard for the entire panel
   */
  public buildFullPanelStoryboard(
    messages: ChatMessage[],
    solutions: HumanitySolution[],
    activeDots: DotAgent[]
  ): VideoStoryboardScene[] {
    const scenes: VideoStoryboardScene[] = [];

    // Prioritize premier solutions first so the user immediately sees the grand narrative video!
    solutions.forEach((sol, idx) => {
      scenes.push(this.createSceneFromSolution(sol, idx));
    });

    // Substantive messages from dots or user
    const substantiveMessages = messages.filter(
      (m) => m.text.length > 15 && (m.senderType === "dot" || m.isConsensus || m.senderType === "user" || m.senderType === "multiplexer")
    );

    substantiveMessages.forEach((msg, idx) => {
      scenes.push(this.createSceneFromMessage(msg, idx + solutions.length));
    });

    // If empty, generate the default flagship mission video
    if (scenes.length === 0) {
      scenes.push(this.generateCoherentMissionVideo(
        "Missão Suprema: 10 Bilhões de IAs & Elevação de Todas as Profissões da Terra",
        "Orquestração multiplataforma pelo Dot 7 e Dot 8 conectando Windows, Android e Supercomputadores Quânticos.",
        activeDots
      ));
    }

    return scenes;
  }

  /**
   * Slices full text into Autobot Radio soundbite collage fragments
   * (simulating an Autobot tuning across frequencies like Bumblebee)
   */
  public sliceTextIntoAutobotSnippets(text: string): AutobotRadioSnippet[] {
    const sentences = text
      .split(/(?<=[.?!;,:])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const rawChunks: string[] = [];
    for (const sentence of sentences) {
      if (sentence.length > 90) {
        const words = sentence.split(" ");
        let current = "";
        for (const w of words) {
          if ((current + " " + w).length > 60 && current.length > 0) {
            rawChunks.push(current.trim());
            current = w;
          } else {
            current = current ? `${current} ${w}` : w;
          }
        }
        if (current.trim()) rawChunks.push(current.trim());
      } else {
        rawChunks.push(sentence);
      }
    }

    const effects: AutobotRadioSnippet['effectType'][] = [
      'static_burst',
      'tuning_chirp',
      'squelch',
      'morse_click',
    ];

    return rawChunks.map((chunk, idx) => {
      const station = AUTOBOT_STATIONS[idx % AUTOBOT_STATIONS.length];
      const effect = effects[idx % effects.length];
      return {
        id: `snippet-${idx}-${Date.now()}`,
        text: chunk,
        frequency: station.freq,
        stationName: station.name,
        pitch: station.pitch + (Math.sin(idx) * 0.1),
        rate: station.rate,
        effectType: effect,
      };
    });
  }
}

export const mediaCollageService = new MediaCollageService();
