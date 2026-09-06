import { TestBed } from '@angular/core/testing';

import { VoiceApiService } from './voice-api.service';

describe('VoiceApiService', () => {
  let service: VoiceApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
