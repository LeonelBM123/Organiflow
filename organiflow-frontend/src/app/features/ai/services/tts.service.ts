import { Injectable } from '@angular/core';
import { loadSpeechSdk } from './azure-speech-sdk';
import { LipSyncCue, TtsResult } from '../models/assistant.model';
import { environment } from '../../../../environments/environment';

const AZURE_TO_ARKIT: Record<number, string> = {
  0: 'X',
  1: 'A',  2: 'E',  3: 'A',  4: 'F',  5: 'A',
  6: 'C',  7: 'D',  8: 'B',  9: 'E', 10: 'F',
  11: 'F', 12: 'D', 13: 'C', 14: 'C', 15: 'C',
  16: 'B', 17: 'B', 18: 'G', 19: 'G', 20: 'H',
  21: 'C',
};

export const SPANISH_VOICES: Record<string, string> = {
  'es-MX-DaliaNeural':   'Femenina — México',
  'es-MX-JorgeNeural':   'Masculina — México',
  'es-ES-ElviraNeural':  'Femenina — España',
  'es-ES-AlvaroNeural':  'Masculina — España',
  'es-AR-ElenaNeural':   'Femenina — Argentina',
  'es-AR-TomasNeural':   'Masculina — Argentina',
  'es-CO-SalomeNeural':  'Femenina — Colombia',
  'es-CO-GonzaloNeural': 'Masculina — Colombia',
};

@Injectable({ providedIn: 'root' })
export class TtsService {
  private readonly key    = environment.azureSpeechKey;
  private readonly region = environment.azureSpeechRegion;

  async synthesizeSpeech(text: string, voiceName = 'es-MX-DaliaNeural'): Promise<TtsResult> {
    const sdk = await loadSpeechSdk();
    const speechConfig = sdk.SpeechConfig.fromSubscription(this.key, this.region);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

    // null → audio queda en result.audioData (no reproduce por altavoz del sistema)
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as unknown as InstanceType<typeof sdk.AudioConfig>);
    const rawVisemes: { audioOffset: number; visemeId: number }[] = [];

    synthesizer.visemeReceived = (_s, e) => {
      rawVisemes.push({
        audioOffset: e.audioOffset / 10_000_000,
        visemeId: e.visemeId,
      });
    };

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        result => {
          synthesizer.close();
          if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
            reject(new Error(`Azure TTS error: ${result.errorDetails}`));
            return;
          }

          const totalDuration = result.audioDuration / 10_000_000;
          const lipSyncData   = this.convertVisemes(rawVisemes, totalDuration);
          const blob          = new Blob([result.audioData], { type: 'audio/mp3' });
          const audioUrl      = URL.createObjectURL(blob);

          resolve({
            audioUrl,
            lipSyncData,
            duration: totalDuration,
            revoke: () => URL.revokeObjectURL(audioUrl),
          });
        },
        error => {
          synthesizer.close();
          reject(error);
        },
      );
    });
  }

  private convertVisemes(
    visemes: { audioOffset: number; visemeId: number }[],
    totalDuration: number,
  ): LipSyncCue[] {
    return visemes.map((v, i, arr) => ({
      start: v.audioOffset,
      end:   arr[i + 1]?.audioOffset ?? totalDuration,
      value: AZURE_TO_ARKIT[v.visemeId] ?? 'X',
    }));
  }
}
