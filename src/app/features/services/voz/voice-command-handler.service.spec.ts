import { TestBed } from '@angular/core/testing';

import { VoiceCommandHandlerService } from './voice-command-handler.service';

describe('VoiceCommandHandlerService', () => {
  let service: VoiceCommandHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceCommandHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
