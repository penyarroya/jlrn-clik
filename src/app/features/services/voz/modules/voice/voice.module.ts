// src/core/services/voz/voice.module.ts
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../../../../shared/services/loggers/logger.service';
import { AudioRecorderService } from '../../audio-recorder.service';
import { VoiceApiService } from '../../voice-api.service';
import { VoiceCommandOrchestratorService } from '../../voice-command-orchestrator.service';
import { VoiceFilterService } from '../../voice-filter.service';
import { VoiceService } from '../../voice.service';

@NgModule({
  imports: [
    CommonModule,  // ✅ Bien - necesario para directivas de Angular
  ],
  providers: [
    // ✅ Todos los servicios registrados correctamente
    LoggerService,
    VoiceService,
    VoiceApiService,
    AudioRecorderService,
    VoiceCommandOrchestratorService,
    VoiceFilterService
  ]
})
export class VoiceModule {
  static forRoot(): ModuleWithProviders<VoiceModule> {
    return {
      ngModule: VoiceModule,
      providers: [
        // ✅ Los mismos servicios para la raíz
        LoggerService,
        VoiceService,
        VoiceApiService,
        AudioRecorderService,
        VoiceCommandOrchestratorService,
        VoiceFilterService
      ]
    };
  }
}