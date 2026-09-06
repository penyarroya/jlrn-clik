import { TestBed } from '@angular/core/testing';

import { VoiceContextService } from './voice-context.service';

describe('VoiceContextService', () => {
  let service: VoiceContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
