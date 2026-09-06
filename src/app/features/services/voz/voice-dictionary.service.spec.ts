import { TestBed } from '@angular/core/testing';

import { VoiceDictionaryService } from './voice-dictionary.service';

describe('VoiceDictionaryService', () => {
  let service: VoiceDictionaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceDictionaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
