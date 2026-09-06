import { TestBed } from '@angular/core/testing';

import { SpellingCorrectionService } from './spelling-correction.service';

describe('SpellingCorrectionService', () => {
  let service: SpellingCorrectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpellingCorrectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
