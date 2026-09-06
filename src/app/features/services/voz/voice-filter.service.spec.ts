import { TestBed } from '@angular/core/testing';
import { VoiceFilterService } from './voice-filter.service';


describe('VoiceFilterService', () => {
  let service: VoiceFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
