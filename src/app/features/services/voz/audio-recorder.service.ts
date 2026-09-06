// src/core/services/voz/audio-recorder.service.ts
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, from, throwError } from 'rxjs';
import { LoggerService } from '../../../shared/services/loggers/logger.service';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService implements OnDestroy {
  private logger = inject(LoggerService);
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioBlob$ = new Subject<Blob>();
  
  private isRecording = false;
  private recordingStartTime = 0; // ✅ NUEVO
  private readonly MAX_RECORDING_TIME = 30000; // 30 segundos
  private recordingTimer: any = null;

  ngOnDestroy(): void {
    this.cancelRecording();
    this.audioBlob$.complete();
  }

  // ============================================================
  // ✅ NUEVOS: MÉTODOS DE VERIFICACIÓN
  // ============================================================

  /**
   * Verifica si el navegador soporta grabación de audio
   */
  isAudioRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Verifica si el navegador soporta el formato de audio
   */
  isMimeTypeSupported(mimeType: string): boolean {
    try {
      return MediaRecorder.isTypeSupported(mimeType);
    } catch {
      return false;
    }
  }

  // ============================================================
  // GRABACIÓN
  // ============================================================

  /**
   * Inicia la grabación de audio
   */
  startRecording(): Observable<boolean> {
    return new Observable((observer) => {
      if (this.isRecording) {
        observer.error(new Error('Ya hay una grabación en curso'));
        return;
      }

      // ✅ Verificar soporte
      if (!this.isAudioRecordingSupported()) {
        observer.error(new Error('El navegador no soporta grabación de audio'));
        return;
      }

      this.logger.log('🎤 Iniciando grabación...');

      navigator.mediaDevices
        .getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1
          }
        })
        .then((stream) => {
          this.stream = stream;
          
          const mimeType = this.getSupportedMimeType();
          this.logger.log(`📀 Usando MIME type: ${mimeType}`);
          
          this.mediaRecorder = new MediaRecorder(stream, { 
            mimeType: mimeType,
            audioBitsPerSecond: 128000
          });
          
          this.audioChunks = [];
          this.recordingStartTime = Date.now(); // ✅ GUARDAR TIEMPO DE INICIO
          
          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              this.audioChunks.push(e.data);
              this.logger.debug(`📦 Chunk de audio: ${e.data.size} bytes`);
            }
          };
          
          this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.audioChunks, { type: mimeType });
            this.logger.log(`🎵 Grabación completada: ${blob.size} bytes`);
            this.audioBlob$.next(blob);
            this.cleanup();
          };
          
          this.mediaRecorder.onerror = (event) => {
            this.logger.error('Error en MediaRecorder:', event);
            observer.error(new Error('Error al grabar audio'));
          };
          
          this.mediaRecorder.start(1000);
          this.isRecording = true;
          
          this.recordingTimer = setTimeout(() => {
            if (this.isRecording) {
              this.logger.warn('⏰ Tiempo máximo de grabación alcanzado');
              this.stopRecording().subscribe();
            }
          }, this.MAX_RECORDING_TIME);
          
          this.logger.log('✅ Grabación iniciada correctamente');
          observer.next(true);
          observer.complete();
        })
        .catch((err) => {
          this.logger.error('❌ Error al acceder al micrófono:', err);
          observer.error(err);
        });
    });
  }

  /**
   * Detiene la grabación y devuelve el audio
   */
  stopRecording(): Observable<Blob> {
    return new Observable((observer) => {
      if (!this.isRecording || this.mediaRecorder?.state !== 'recording') {
        observer.error(new Error('No hay grabación activa'));
        return;
      }

      this.logger.log('⏹️ Deteniendo grabación...');
      
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }

      this.mediaRecorder.stop();

      const sub = this.audioBlob$.subscribe({
        next: (blob) => {
          observer.next(blob);
          observer.complete();
          sub.unsubscribe();
        },
        error: (err) => {
          observer.error(err);
          sub.unsubscribe();
        }
      });
    });
  }

  /**
   * Cancela la grabación sin devolver audio
   */
  cancelRecording(): void {
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.logger.warn('Error al cancelar grabación:', e);
      }
    }
    this.cleanup();
    this.logger.log('❌ Grabación cancelada');
  }

  // ============================================================
  // ✅ NUEVOS: PAUSA Y REANUDACIÓN
  // ============================================================

  /**
   * Pausa la grabación
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.logger.log('⏸️ Grabación pausada');
    }
  }

  /**
   * Reanuda la grabación
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.logger.log('▶️ Grabación reanudada');
    }
  }

  /**
   * Alterna entre pausar y reanudar
   */
  togglePause(): void {
    if (!this.mediaRecorder) return;
    
    if (this.mediaRecorder.state === 'recording') {
      this.pauseRecording();
    } else if (this.mediaRecorder.state === 'paused') {
      this.resumeRecording();
    }
  }

  // ============================================================
  // LIMPIEZA DE RECURSOS
  // ============================================================

  private cleanup(): void {
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = 0; // ✅ RESETEAR
    
    if (this.stream) {
      this.stream.getTracks().forEach(t => {
        t.stop();
        this.logger.debug(`🔊 Track ${t.kind} detenido`);
      });
      this.stream = null;
    }
    
    this.mediaRecorder = null;
  }

  // ============================================================
  // SOPORTE DE MIME TYPES
  // ============================================================

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];
    
    for (const type of types) {
      try {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      } catch (e) {
        // Ignorar errores de isTypeSupported
      }
    }
    
    this.logger.warn('⚠️ No se encontró MIME type soportado, usando default');
    return 'audio/webm';
  }

  // ============================================================
  // CONVERSIÓN A WAV
  // ============================================================

  /**
   * Convierte webm a WAV (16kHz, mono, PCM 16 bits)
   */
  async convertToWav(webmBlob: Blob): Promise<Blob> {
    this.logger.log('🔄 Convirtiendo a WAV...');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          const buffer = await audioCtx.decodeAudioData(e.target?.result as ArrayBuffer);
          
          const data = buffer.getChannelData(0);
          
          const pcm = new Int16Array(data.length);
          for (let i = 0; i < data.length; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          const wav = this.buildWav(pcm, 16000);
          
          this.logger.log(`✅ WAV generado: ${wav.byteLength} bytes`);
          resolve(new Blob([wav], { type: 'audio/wav' }));
        } catch (err) {
          this.logger.error('Error al convertir a WAV:', err);
          reject(err);
        }
      };
      
      reader.onerror = (err) => {
        this.logger.error('Error al leer el archivo:', err);
        reject(err);
      };
      
      reader.readAsArrayBuffer(webmBlob);
    });
  }

  /**
   * Construye un archivo WAV a partir de datos PCM
   */
  private buildWav(pcm: Int16Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = pcm.length * (bitsPerSample / 8);
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    const pcmView = new Int16Array(buffer, 44, pcm.length);
    pcmView.set(pcm);
    
    return buffer;
  }

  // ============================================================
  // ✅ NUEVOS: MÉTODOS DE ESTADO
  // ============================================================

  /**
   * Verifica si está grabando
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Obtiene el estado actual de la grabación
   */
  getRecordingState(): 'idle' | 'recording' | 'paused' | 'stopped' | 'error' {
    if (!this.mediaRecorder) return 'idle';
    if (!this.isRecording) return 'stopped';
    
    switch (this.mediaRecorder.state) {
      case 'recording': return 'recording';
      case 'paused': return 'paused';
      case 'inactive': return 'stopped';
      default: return 'idle';
    }
  }

  /**
   * Obtiene el tiempo de grabación actual en segundos
   */
  getRecordingTime(): number {
    if (!this.isRecording || !this.recordingStartTime) {
      return 0;
    }
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  /**
   * Obtiene el tiempo de grabación formateado (MM:SS)
   */
  getRecordingTimeFormatted(): string {
    const seconds = Math.floor(this.getRecordingTime());
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene información del estado actual
   */
  getRecordingInfo(): {
    isActive: boolean;
    state: string;
    duration: number;
    durationFormatted: string;
    chunks: number;
  } {
    return {
      isActive: this.isRecording,
      state: this.getRecordingState(),
      duration: this.getRecordingTime(),
      durationFormatted: this.getRecordingTimeFormatted(),
      chunks: this.audioChunks.length
    };
  }
}