import { TestBed } from '@angular/core/testing';

import { FieldCleanupService } from './field-cleanup.service';

describe('FieldCleanupService', () => {
  let service: FieldCleanupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FieldCleanupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
