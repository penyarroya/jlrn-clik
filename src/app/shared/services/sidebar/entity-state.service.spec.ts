import { TestBed } from '@angular/core/testing';
import { EntityStateService } from './entity-state.service';

describe('EntityStateService', () => {
  let service: EntityStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
