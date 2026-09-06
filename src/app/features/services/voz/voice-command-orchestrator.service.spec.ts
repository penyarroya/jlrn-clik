import { TestBed } from '@angular/core/testing';

import { VoiceCommandOrchestratorService } from './voice-command-orchestrator.service';

describe('VoiceCommandOrchestratorService', () => {
  let service: VoiceCommandOrchestratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceCommandOrchestratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
