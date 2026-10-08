import { VoiceName } from "../types";

class AudioSpeechManager {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private recognition: any = null;
  private isListening: boolean = false;

  public initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
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
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public playBase64Audio(
    base64Data: string,
    mimeType: string = "audio/wav",
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isMuted) {
      onEnd?.();
      return Promise.resolve();
    }

    this.stopCurrentSpeech();
    this.initAudioContext();

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
      } catch (e) {
        onEnd?.();
        resolve();
      }
    });
  }

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

        // Voice personality pitch and rate
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

        // Try selecting a pt-BR voice if available
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(
          (v) => v.lang.startsWith("pt") || v.lang.includes("BR")
        );
        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        utterance.onstart = () => {
          onStart?.();
        };

        utterance.onend = () => {
          onEnd?.();
          resolve();
        };

        utterance.onerror = () => {
          onEnd?.();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        onEnd?.();
        resolve();
      }
    });
  }

  // Voice Recognition for Gemini Conversation Bar
  public startSpeechRecognition(
    onResult: (transcript: string) => void,
    onError?: (error: any) => void,
    onEnd?: () => void
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "pt-BR";

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (err: any) => {
        this.isListening = false;
        onError?.(err);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd?.();
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
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }
}

export const audioSpeechService = new AudioSpeechManager();
