import { VoiceName } from "../types";

export interface VisualizerState {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  volume: number; // 0 to 1
  source: "mic" | "speaker" | "idle";
  isMicActive: boolean;
  isSpeaking: boolean;
}

class AudioSpeechManager {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentBufferSource: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;
  private recognition: any = null;
  private isListening: boolean = false;
  private isLiveMode: boolean = false;

  // Analysers for Real-Time Visualization
  private micAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;

  // Synth analyser for Web Speech API fallback
  private synthOscillator: OscillatorNode | null = null;
  private synthGain: GainNode | null = null;
  private isSynthSpeaking: boolean = false;

  private fftSize: number = 128;
  private freqBuffer: Uint8Array = new Uint8Array(64);
  private timeBuffer: Uint8Array = new Uint8Array(64);

  public initAudioContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    if (this.audioCtx && !this.outputAnalyser) {
      this.outputAnalyser = this.audioCtx.createAnalyser();
      this.outputAnalyser.fftSize = this.fftSize;
      this.outputAnalyser.smoothingTimeConstant = 0.85;
      this.outputAnalyser.connect(this.audioCtx.destination);
    }

    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopCurrentSpeech();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopCurrentSpeech() {
    if (this.currentBufferSource) {
      try {
        this.currentBufferSource.stop();
        this.currentBufferSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.currentBufferSource = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.stopSynthSimulation();
  }

  // --- Real-Time Microphone Analysis ---
  public async startMicAudioStream(): Promise<boolean> {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return false;

      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!this.micAnalyser) {
        this.micAnalyser = ctx.createAnalyser();
        this.micAnalyser.fftSize = this.fftSize;
        this.micAnalyser.smoothingTimeConstant = 0.8;
      }

      if (this.micSourceNode) {
        try {
          this.micSourceNode.disconnect();
        } catch (e) {}
      }

      this.micSourceNode = ctx.createMediaStreamSource(this.micStream);
      this.micSourceNode.connect(this.micAnalyser);
      return true;
    } catch (err) {
      console.warn("Could not access microphone media stream:", err);
      return false;
    }
  }

  public stopMicAudioStream() {
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch (e) {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }

  // Play audio buffer through outputAnalyser for authentic frequency response
  public async playBase64Audio(
    base64Data: string,
    mimeType: string = "audio/wav",
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isMuted) {
      onEnd?.();
      return;
    }

    this.stopCurrentSpeech();
    const ctx = this.initAudioContext();
    if (!ctx) {
      onEnd?.();
      return;
    }

    try {
      // Decode base64 into ArrayBuffer
      const binaryStr = window.atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      this.currentBufferSource = source;

      if (!this.outputAnalyser) {
        this.outputAnalyser = ctx.createAnalyser();
        this.outputAnalyser.fftSize = this.fftSize;
        this.outputAnalyser.smoothingTimeConstant = 0.85;
      }

      source.connect(this.outputAnalyser);
      this.outputAnalyser.connect(ctx.destination);

      return new Promise<void>((resolve) => {
        source.onended = () => {
          this.currentBufferSource = null;
          onEnd?.();
          resolve();
        };

        onStart?.();
        source.start(0);
      });
    } catch (e) {
      console.warn("Falling back to HTMLAudioElement playback:", e);
      // Fallback: standard audio element
      return new Promise((resolve) => {
        try {
          const audioSrc = `data:${mimeType};base64,${base64Data}`;
          const audio = new Audio(audioSrc);
          this.currentAudio = audio;

          audio.onplay = () => {
            onStart?.();
          };

          audio.onended = () => {
            this.currentAudio = null;
            onEnd?.();
            resolve();
          };

          audio.onerror = () => {
            this.currentAudio = null;
            onEnd?.();
            resolve();
          };

          audio.play().catch(() => {
            this.currentAudio = null;
            onEnd?.();
            resolve();
          });
        } catch (err) {
          onEnd?.();
          resolve();
        }
      });
    }
  }

  // Fallback Web Speech Synthesis with real-time spectrum modulation
  public speakBrowserSpeech(
    text: string,
    voiceName: VoiceName = "Zephyr",
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isMuted || !("speechSynthesis" in window)) {
      onEnd?.();
      return Promise.resolve();
    }

    this.stopCurrentSpeech();

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";

        switch (voiceName) {
          case "Zephyr":
            utterance.pitch = 1.15;
            utterance.rate = 1.05;
            break;
          case "Puck":
            utterance.pitch = 1.35;
            utterance.rate = 1.12;
            break;
          case "Charon":
            utterance.pitch = 0.75;
            utterance.rate = 0.95;
            break;
          case "Kore":
            utterance.pitch = 0.95;
            utterance.rate = 1.0;
            break;
          case "Fenrir":
            utterance.pitch = 0.85;
            utterance.rate = 1.1;
            break;
          case "Leda":
            utterance.pitch = 1.25;
            utterance.rate = 1.05;
            break;
          case "Aoede":
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
            break;
          default:
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }

        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(
          (v) => v.lang.startsWith("pt") || v.lang.includes("BR")
        );
        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        utterance.onstart = () => {
          this.startSynthSimulation();
          onStart?.();
        };

        utterance.onend = () => {
          this.stopSynthSimulation();
          onEnd?.();
          resolve();
        };

        utterance.onerror = () => {
          this.stopSynthSimulation();
          onEnd?.();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        this.stopSynthSimulation();
        onEnd?.();
        resolve();
      }
    });
  }

  private startSynthSimulation() {
    this.isSynthSpeaking = true;
    const ctx = this.initAudioContext();
    if (!ctx) return;

    try {
      if (!this.synthOscillator) {
        this.synthOscillator = ctx.createOscillator();
        this.synthGain = ctx.createGain();

        // Keep audible volume at zero so it doesn't duplicate speech sound,
        // but routes signal directly into output analyser!
        this.synthGain.gain.value = 0.35;
        this.synthOscillator.frequency.value = 240;

        if (!this.outputAnalyser) {
          this.outputAnalyser = ctx.createAnalyser();
          this.outputAnalyser.fftSize = this.fftSize;
        }

        this.synthOscillator.connect(this.synthGain);
        this.synthGain.connect(this.outputAnalyser);
        // Do NOT connect this dummy oscillator to ctx.destination, keeping it purely for visualization!
        this.synthOscillator.start();
      }
    } catch (e) {}
  }

  private stopSynthSimulation() {
    this.isSynthSpeaking = false;
    if (this.synthOscillator) {
      try {
        this.synthOscillator.stop();
        this.synthOscillator.disconnect();
      } catch (e) {}
      this.synthOscillator = null;
    }
    if (this.synthGain) {
      try {
        this.synthGain.disconnect();
      } catch (e) {}
      this.synthGain = null;
    }
  }

  // --- Real-time Visualizer Data Extractor ---
  public getVisualizerData(): VisualizerState {
    const isAudioPlaying =
      this.currentBufferSource !== null ||
      (this.currentAudio !== null && !this.currentAudio.paused) ||
      this.isSynthSpeaking;

    if (isAudioPlaying && this.outputAnalyser) {
      // Speaker has priority
      this.outputAnalyser.getByteFrequencyData(this.freqBuffer as any);
      this.outputAnalyser.getByteTimeDomainData(this.timeBuffer as any);

      let sum = 0;
      for (let i = 0; i < this.freqBuffer.length; i++) {
        sum += this.freqBuffer[i];
      }
      const avg = sum / this.freqBuffer.length;
      const volume = Math.min(1, avg / 128);

      return {
        frequencyData: this.freqBuffer,
        timeDomainData: this.timeBuffer,
        volume,
        source: "speaker",
        isMicActive: this.isListening,
        isSpeaking: true,
      };
    }

    if (this.isListening && this.micAnalyser) {
      // Microphone active
      this.micAnalyser.getByteFrequencyData(this.freqBuffer as any);
      this.micAnalyser.getByteTimeDomainData(this.timeBuffer as any);

      let sum = 0;
      for (let i = 0; i < this.freqBuffer.length; i++) {
        sum += this.freqBuffer[i];
      }
      const avg = sum / this.freqBuffer.length;
      const volume = Math.min(1, avg / 128);

      return {
        frequencyData: this.freqBuffer,
        timeDomainData: this.timeBuffer,
        volume,
        source: "mic",
        isMicActive: true,
        isSpeaking: false,
      };
    }

    // Idle
    this.freqBuffer.fill(0);
    this.timeBuffer.fill(128);
    return {
      frequencyData: this.freqBuffer,
      timeDomainData: this.timeBuffer,
      volume: 0,
      source: "idle",
      isMicActive: this.isListening,
      isSpeaking: false,
    };
  }

  // --- Speech Recognition ---
  public startSpeechRecognition(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: any) => void,
    onEnd?: () => void,
    continuous: boolean = false
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false;
    }

    try {
      this.startMicAudioStream();

      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = continuous;
      this.recognition.interimResults = true;
      this.recognition.lang = "pt-BR";

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        const text = (finalText || interimText).trim();
        if (text) {
          onResult(text, !!finalText);
        }
      };

      this.recognition.onerror = (err: any) => {
        if (!continuous) {
          this.isListening = false;
        }
        onError?.(err);
      };

      this.recognition.onend = () => {
        if (this.isLiveMode && continuous) {
          // Restart recognition in Live Mode
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            onEnd?.();
          }
        } else {
          this.isListening = false;
          onEnd?.();
        }
      };

      this.recognition.start();
      return true;
    } catch (e) {
      this.isListening = false;
      onError?.(e);
      return false;
    }
  }

  public stopSpeechRecognition() {
    this.isLiveMode = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
    this.stopMicAudioStream();
  }

  public setLiveMode(active: boolean) {
    this.isLiveMode = active;
    if (!active) {
      this.stopSpeechRecognition();
    }
  }

  // --- Autobot Radio Sound Collage Engine ---
  private isAutobotRadioActive: boolean = false;
  private currentAutobotAbortController: AbortController | null = null;

  public isAutobotRadioPlaying(): boolean {
    return this.isAutobotRadioActive;
  }

  public stopAutobotRadio() {
    this.isAutobotRadioActive = false;
    if (this.currentAutobotAbortController) {
      this.currentAutobotAbortController.abort();
      this.currentAutobotAbortController = null;
    }
    this.stopCurrentSpeech();
  }

  // Synthesize realistic radio tuning static noise burst
  public playRadioStatic(durationMs: number = 220): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    const ctx = this.initAudioContext();
    if (!ctx) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const bufferSize = Math.floor(ctx.sampleRate * (durationMs / 1000));
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        // Bandpass filter to sound like an analog AM/FM radio receiver
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 1600;
        bandpass.Q.value = 2.5;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (durationMs / 1000));

        whiteNoise.connect(bandpass);
        bandpass.connect(gainNode);

        if (this.outputAnalyser) {
          gainNode.connect(this.outputAnalyser);
        } else {
          gainNode.connect(ctx.destination);
        }

        whiteNoise.onended = () => {
          whiteNoise.disconnect();
          bandpass.disconnect();
          gainNode.disconnect();
          resolve();
        };

        whiteNoise.start();
        setTimeout(resolve, durationMs + 20);
      } catch (e) {
        resolve();
      }
    });
  }

  // Synthesize a retro radio dial sweep / frequency chirp
  public playTuningChirp(startFreq: number = 750, endFreq: number = 2400, durationMs: number = 140): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    const ctx = this.initAudioContext();
    if (!ctx) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + (durationMs / 1000));

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (durationMs / 1000));

        osc.connect(gain);
        if (this.outputAnalyser) {
          gain.connect(this.outputAnalyser);
        } else {
          gain.connect(ctx.destination);
        }

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
          resolve();
        };

        osc.start();
        osc.stop(ctx.currentTime + (durationMs / 1000));
        setTimeout(resolve, durationMs + 20);
      } catch (e) {
        resolve();
      }
    });
  }

  // Squelch click (walkie-talkie button release)
  public playSquelchClick(): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    const ctx = this.initAudioContext();
    if (!ctx) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.03);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.connect(gain);
        if (this.outputAnalyser) gain.connect(this.outputAnalyser);
        else gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.07);
        setTimeout(resolve, 80);
      } catch (e) {
        resolve();
      }
    });
  }

  // Quantum Morse code beeps
  public playMorseCodeSnippet(_text: string = "NEXUS"): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    const ctx = this.initAudioContext();
    if (!ctx) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.2, now + 0.04);
        gain.gain.setValueAtTime(0, now + 0.10);
        gain.gain.setValueAtTime(0.2, now + 0.15);
        gain.gain.setValueAtTime(0, now + 0.22);
        gain.gain.setValueAtTime(0.2, now + 0.28);
        gain.gain.setValueAtTime(0, now + 0.42);

        osc.connect(gain);
        if (this.outputAnalyser) gain.connect(this.outputAnalyser);
        else gain.connect(ctx.destination);

        osc.start();
        osc.stop(now + 0.45);
        setTimeout(resolve, 480);
      } catch (e) {
        resolve();
      }
    });
  }

  // High-level Autobot Radio Collage: plays multi-frequency radio speech with tuning bursts
  public async playAutobotRadioCollageSpeech(
    text: string,
    onSnippetChange?: (idx: number, total: number, snippet: any) => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isMuted) {
      onEnd?.();
      return;
    }

    this.stopAutobotRadio();
    this.isAutobotRadioActive = true;
    const abortCtrl = new AbortController();
    this.currentAutobotAbortController = abortCtrl;

    const { mediaCollageService } = await import("./mediaCollageService");
    const snippets = mediaCollageService.sliceTextIntoAutobotSnippets(text);

    if (snippets.length === 0) {
      this.isAutobotRadioActive = false;
      onEnd?.();
      return;
    }

    try {
      // Opening radio scan chirp
      await this.playTuningChirp(500, 1800, 160);
      await this.playRadioStatic(180);

      for (let i = 0; i < snippets.length; i++) {
        if (abortCtrl.signal.aborted || !this.isAutobotRadioActive) break;

        const snip = snippets[i];
        onSnippetChange?.(i, snippets.length, snip);

        // Sound effect before snippet (like switching radio stations)
        if (i > 0) {
          if (snip.effectType === "static_burst") {
            await this.playRadioStatic(190);
          } else if (snip.effectType === "tuning_chirp") {
            await this.playTuningChirp(900, 2200, 130);
          } else {
            await this.playSquelchClick();
          }
        }

        if (abortCtrl.signal.aborted || !this.isAutobotRadioActive) break;

        // Speak the snippet with modulated radio frequency voice
        await new Promise<void>((resolve) => {
          if (!("speechSynthesis" in window)) {
            setTimeout(resolve, 1200);
            return;
          }

          try {
            const utterance = new SpeechSynthesisUtterance(snip.text);
            utterance.lang = "pt-BR";
            utterance.pitch = Math.max(0.6, Math.min(1.8, snip.pitch));
            utterance.rate = Math.max(0.85, Math.min(1.4, snip.rate));

            const voices = window.speechSynthesis.getVoices();
            const ptVoices = voices.filter(
              (v) => v.lang.startsWith("pt") || v.lang.includes("BR")
            );
            if (ptVoices.length > 0) {
              // Vary voice if multiple are installed in browser
              utterance.voice = ptVoices[i % ptVoices.length];
            }

            utterance.onstart = () => {
              this.startSynthSimulation();
            };

            utterance.onend = () => {
              this.stopSynthSimulation();
              resolve();
            };

            utterance.onerror = () => {
              this.stopSynthSimulation();
              resolve();
            };

            window.speechSynthesis.speak(utterance);
          } catch (e) {
            resolve();
          }
        });

        // Micro-pause between radio frequency jumps
        await new Promise((r) => setTimeout(r, 90));
      }

      // Closing radio squelch
      if (!abortCtrl.signal.aborted && this.isAutobotRadioActive) {
        await this.playSquelchClick();
      }
    } finally {
      this.isAutobotRadioActive = false;
      this.currentAutobotAbortController = null;
      this.stopSynthSimulation();
      onEnd?.();
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const audioSpeechService = new AudioSpeechManager();
