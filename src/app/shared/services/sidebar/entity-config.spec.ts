import { TestBed } from '@angular/core/testing';
import { EntityConfig } from './entity-config';

describe('EntityConfig', () => {
  let service: EntityConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
