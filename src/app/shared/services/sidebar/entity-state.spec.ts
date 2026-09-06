import { TestBed } from '@angular/core/testing';
import { EntityState } from './entity-state';

describe('EntityState', () => {
  let service: EntityState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
